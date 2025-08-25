import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const kitchenId = formData.get('kitchenId') as string;
    const nomeContrato = formData.get('nomeContrato') as string;
    const descricao = formData.get('descricao') as string;
    const tipoContrato = formData.get('tipoContrato') as string;

    if (!file || !kitchenId || !nomeContrato) {
      return NextResponse.json(
        { error: 'Arquivo, cozinha e nome do contrato são obrigatórios' },
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

    // Verificar se o usuário é admin da cozinha
    const { data: userRole, error: roleError } = await supabase
      .from('user_kitchen_roles')
      .select('role')
      .eq('kitchen_id', kitchenId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (roleError || userRole?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem gerenciar contratos' },
        { status: 403 }
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

    // Salvar informações do contrato no banco
    const { data: savedContract, error: saveError } = await supabase
      .from('kitchen_contracts')
      .insert([{
        kitchen_id: kitchenId,
        file_id: uploadedFile.id,
        nome_contrato: nomeContrato,
        descricao: descricao || null,
        tipo_contrato: tipoContrato || 'outros',
        nome_arquivo: file.name,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
        criado_por: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar contrato no banco:', saveError);
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
      contract: {
        id: savedContract.id,
        file_id: uploadedFile.id,
        nome_contrato: nomeContrato,
        descricao: descricao,
        tipo_contrato: tipoContrato,
        nome_arquivo: file.name,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
        criado_em: savedContract.criado_em,
      },
    });

  } catch (error: any) {
    console.error('Erro no upload do contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}