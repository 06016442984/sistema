import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'Arquivo e ID da conversa são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (máximo 512MB para OpenAI)
    const maxSize = 512 * 1024 * 1024; // 512MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 512MB' },
        { status: 400 }
      );
    }

    // Buscar configurações de IA
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('openai_api_key')
      .limit(1)
      .single();

    if (settingsError || !settings?.openai_api_key) {
      return NextResponse.json(
        { error: 'Configurações de IA não encontradas' },
        { status: 400 }
      );
    }

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Inicializar cliente OpenAI
    const openai = new OpenAI({
      apiKey: settings.openai_api_key,
    });

    // Converter File para formato aceito pelo OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload do arquivo para OpenAI
    const uploadedFile = await openai.files.create({
      file: new File([buffer], file.name, { type: file.type }),
      purpose: 'assistants',
    });

    // Salvar informações do arquivo no banco
    const { data: savedFile, error: saveError } = await supabase
      .from('ai_files')
      .insert([{
        conversation_id: conversationId,
        file_id: uploadedFile.id,
        nome_original: file.name,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
      }])
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar arquivo no banco:', saveError);
      // Tentar deletar arquivo do OpenAI se falhou salvar no banco
      try {
        await openai.files.del(uploadedFile.id);
      } catch (deleteError) {
        console.error('Erro ao deletar arquivo do OpenAI:', deleteError);
      }
      throw saveError;
    }

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        file_id: uploadedFile.id,
        nome_original: file.name,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
        criado_em: savedFile.criado_em,
      },
    });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}