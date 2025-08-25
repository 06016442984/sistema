import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, assistantId } = await request.json();

    // Buscar configurações de IA
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('openai_api_key, default_model, max_tokens, temperature')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Erro ao buscar configurações:', settingsError);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações de IA' },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: 'Nenhuma configuração de IA encontrada. Configure em Configurações > IA & Integrações.' },
        { status: 400 }
      );
    }

    if (!settings.openai_api_key) {
      return NextResponse.json(
        { error: 'Chave da OpenAI não configurada. Configure em Configurações > IA & Integrações.' },
        { status: 400 }
      );
    }

    // Inicializar cliente OpenAI
    const openai = new OpenAI({
      apiKey: settings.openai_api_key,
    });

    // Buscar dados do assistente e cozinha
    const { data: assistant, error: assistantError } = await supabase
      .from('kitchen_assistants')
      .select('assistant_id, nome, instrucoes, kitchen_id')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json(
        { error: 'Assistente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar ou criar thread
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .select('thread_id, kitchen_id')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    let threadId = conversation.thread_id;

    // Criar thread se não existir
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;

      // Atualizar conversa com thread_id
      await supabase
        .from('ai_conversations')
        .update({ thread_id: threadId })
        .eq('id', conversationId);
    }

    // Buscar arquivos da conversa
    const { data: conversationFiles, error: filesError } = await supabase
      .from('ai_files')
      .select('file_id')
      .eq('conversation_id', conversationId);

    if (filesError) {
      console.error('Erro ao buscar arquivos da conversa:', filesError);
    }

    // Buscar contratos da cozinha
    const { data: kitchenContracts, error: contractsError } = await supabase
      .from('kitchen_contracts')
      .select('file_id, nome_contrato')
      .eq('kitchen_id', conversation.kitchen_id)
      .eq('ativo', true);

    if (contractsError) {
      console.error('Erro ao buscar contratos da cozinha:', contractsError);
    }

    // Combinar arquivos da conversa e contratos da cozinha
    const conversationFileIds = conversationFiles?.map(f => f.file_id).filter(Boolean) || [];
    const contractFileIds = kitchenContracts?.map(c => c.file_id).filter(Boolean) || [];
    const allFileIds = [...conversationFileIds, ...contractFileIds];

    console.log('📁 Arquivos disponíveis:', {
      conversa: conversationFileIds.length,
      contratos: contractFileIds.length,
      total: allFileIds.length
    });

    // Adicionar mensagem à thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
      file_ids: allFileIds, // Incluir arquivos da conversa + contratos da cozinha
    });

    // Criar ou buscar assistente no OpenAI
    let openaiAssistantId = assistant.assistant_id;

    if (!openaiAssistantId) {
      // Preparar instruções com informações sobre contratos
      let instructions = assistant.instrucoes || 'Você é um assistente útil para gerenciamento de cozinhas.';
      
      if (kitchenContracts && kitchenContracts.length > 0) {
        const contractsList = kitchenContracts.map(c => c.nome_contrato).join(', ');
        instructions += `\n\nVocê tem acesso aos seguintes contratos desta cozinha: ${contractsList}. Use essas informações para responder perguntas sobre fornecedores, serviços, preços, prazos e outras informações contratuais.`;
      }

      // Criar assistente no OpenAI
      const createdAssistant = await openai.beta.assistants.create({
        name: assistant.nome,
        instructions: instructions,
        model: settings.default_model,
        tools: [
          { type: 'code_interpreter' },
          { type: 'retrieval' }
        ],
        file_ids: allFileIds, // Associar todos os arquivos ao assistente
      });

      openaiAssistantId = createdAssistant.id;

      // Salvar ID do assistente
      await supabase
        .from('kitchen_assistants')
        .update({ assistant_id: openaiAssistantId })
        .eq('id', assistantId);
    } else {
      // Atualizar assistente existente com novos arquivos
      try {
        await openai.beta.assistants.update(openaiAssistantId, {
          file_ids: allFileIds,
        });
      } catch (updateError) {
        console.error('Erro ao atualizar assistente com arquivos:', updateError);
      }
    }

    // Executar assistente
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: openaiAssistantId,
    });

    // Aguardar conclusão com timeout
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 60; // 60 segundos máximo

    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
    }

    if (runStatus.status === 'completed') {
      // Buscar mensagens da thread
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];

      if (lastMessage && lastMessage.role === 'assistant') {
        const content = lastMessage.content[0];
        if (content.type === 'text') {
          return NextResponse.json({
            success: true,
            response: content.text.value,
            threadId: threadId,
            filesUsed: allFileIds.length,
            contractsAvailable: contractFileIds.length,
            conversationFiles: conversationFileIds.length,
          });
        }
      }
    } else if (runStatus.status === 'failed') {
      return NextResponse.json(
        { error: `Assistente falhou: ${runStatus.last_error?.message || 'Erro desconhecido'}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Timeout: Assistente demorou muito para responder' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar resposta do assistente' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('Erro na API de chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}