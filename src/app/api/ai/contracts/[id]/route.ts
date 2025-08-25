import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

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

    // Buscar contrato e verificar permissões
    const { data: contract, error: contractError } = await supabase
      .from('kitchen_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin da cozinha
    const { data: userRole, error: roleError } = await supabase
      .from('user_kitchen_roles')
      .select('role')
      .eq('kitchen_id', contract.kitchen_id)
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

    // Deletar arquivo do OpenAI
    if (contract.file_id) {
      try {
        await openai.files.del(contract.file_id);
      } catch (openaiError) {
        console.error('Erro ao deletar arquivo do OpenAI:', openaiError);
        // Continuar mesmo se falhar no OpenAI
      }
    }

    // Deletar contrato do banco
    const { error: deleteError } = await supabase
      .from('kitchen_contracts')
      .delete()
      .eq('id', contractId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Contrato deletado com sucesso',
    });

  } catch (error: any) {
    console.error('Erro ao deletar contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}