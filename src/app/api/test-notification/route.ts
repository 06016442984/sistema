import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { taskId, userId } = await request.json();

    console.log('🧪 Testando notificação para tarefa:', taskId, 'usuário:', userId);

    // Buscar dados da tarefa
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        titulo,
        descricao,
        prioridade,
        prazo,
        projects (nome)
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('nome, telefone, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('👤 Usuário encontrado:', user.nome, 'Telefone:', user.telefone);

    // Verificar se tem telefone
    if (!user.telefone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuário não tem telefone cadastrado',
          userInfo: { nome: user.nome, email: user.email }
        },
        { status: 400 }
      );
    }

    // Preparar dados para WhatsApp
    const taskData = {
      taskId: task.id,
      taskTitle: task.titulo,
      taskDescription: task.descricao || 'Teste de notificação',
      projectName: task.projects?.nome || 'Projeto Teste',
      priority: task.prioridade,
      deadline: task.prazo,
      assignedUserId: userId,
      assignedByName: 'Sistema de Teste',
      reminderType: 'DELEGACAO'
    };

    console.log('📤 Enviando dados para WhatsApp API:', taskData);

    // Chamar API de WhatsApp
    const whatsappResponse = await fetch(
      `${request.nextUrl.origin}/api/whatsapp-send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskData }),
      }
    );

    const whatsappResult = await whatsappResponse.json();
    console.log('📥 Resultado WhatsApp:', whatsappResult);

    // Log do teste
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        recurso: 'test_notification',
        recurso_id: taskId,
        acao: whatsappResult.success ? 'test_success' : 'test_failed',
        payload: {
          task_title: task.titulo,
          user_name: user.nome,
          phone: user.telefone,
          whatsapp_result: whatsappResult,
          test_time: new Date().toISOString()
        }
      }]);

    if (whatsappResult.success) {
      return NextResponse.json({
        success: true,
        message: `Notificação de teste enviada para ${user.nome}`,
        taskTitle: task.titulo,
        userName: user.nome,
        phone: user.telefone,
        whatsappResult
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: whatsappResult.error,
          details: whatsappResult
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('💥 Erro no teste de notificação:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Erro interno no teste de notificação'
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para listar tarefas disponíveis para teste
export async function GET() {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        titulo,
        prioridade,
        responsavel_id,
        profiles!tasks_responsavel_id_fkey (nome, telefone, email)
      `)
      .not('responsavel_id', 'is', null)
      .order('criado_em', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}