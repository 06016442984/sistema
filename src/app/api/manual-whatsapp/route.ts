import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { taskId, assignedUserId, assignedByName } = await request.json();

    if (!taskId || !assignedUserId) {
      return NextResponse.json(
        { success: false, error: 'taskId e assignedUserId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('📋 Enviando WhatsApp manual para tarefa:', taskId);

    // Buscar dados da tarefa
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        titulo,
        descricao,
        prioridade,
        prazo,
        projects (
          nome,
          kitchens (nome)
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !taskData) {
      console.error('❌ Erro ao buscar tarefa:', taskError);
      return NextResponse.json(
        { success: false, error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Preparar dados para o WhatsApp
    const whatsappData = {
      taskId: taskData.id,
      taskTitle: taskData.titulo,
      taskDescription: taskData.descricao,
      projectName: taskData.projects?.nome || 'Projeto',
      priority: taskData.prioridade,
      deadline: taskData.prazo,
      assignedUserId: assignedUserId,
      assignedByName: assignedByName || 'Sistema',
      reminderType: 'DELEGACAO'
    };

    console.log('📤 Enviando dados para WhatsApp API:', whatsappData);

    // Chamar API de WhatsApp
    const whatsappResponse = await fetch(
      `${request.nextUrl.origin}/api/whatsapp-send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskData: whatsappData }),
      }
    );

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('❌ Erro da API WhatsApp:', whatsappResult);
      return NextResponse.json(
        { 
          success: false, 
          error: whatsappResult.error || 'Erro ao enviar WhatsApp',
          details: whatsappResult.details
        },
        { status: 500 }
      );
    }

    console.log('✅ WhatsApp enviado com sucesso:', whatsappResult);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp enviado com sucesso',
      whatsappResult
    });

  } catch (error: any) {
    console.error('💥 Erro ao enviar WhatsApp manual:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}