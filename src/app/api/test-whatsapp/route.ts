import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do usuário
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('nome, telefone, email')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!userProfile.telefone) {
      return NextResponse.json(
        { success: false, error: 'Telefone não configurado' },
        { status: 400 }
      );
    }

    // Dados de teste
    const testTaskData = {
      taskId: 'test-' + Date.now(),
      taskTitle: '🧪 Teste de Notificação WhatsApp',
      taskDescription: 'Esta é uma mensagem de teste para verificar se as notificações WhatsApp estão funcionando corretamente via Evolution API.',
      projectName: 'Sistema de Testes',
      priority: 'MEDIA',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedUserId: userId,
      assignedByName: 'Sistema de Notificações'
    };

    // Chamar API interna
    const response = await fetch(
      `${request.nextUrl.origin}/api/whatsapp-send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskData: testTaskData }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro na API de WhatsApp');
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem de teste enviada com sucesso via Evolution API',
      details: result
    });

  } catch (error: any) {
    console.error('Erro ao enviar teste WhatsApp:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Verifique as configurações da Evolution API e do Supabase'
      },
      { status: 500 }
    );
  }
}