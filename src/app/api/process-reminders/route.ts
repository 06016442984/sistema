import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processando lembretes agendados...');

    // Buscar lembretes que devem ser enviados agora
    const now = new Date();
    const { data: reminders, error: remindersError } = await supabase
      .from('task_reminders')
      .select(`
        id,
        task_id,
        user_id,
        reminder_type,
        scheduled_time,
        tasks (
          id,
          titulo,
          descricao,
          prioridade,
          prazo,
          projects (nome)
        ),
        profiles (
          nome,
          telefone,
          email
        )
      `)
      .eq('sent', false)
      .lte('scheduled_time', now.toISOString())
      .limit(50); // Processar até 50 lembretes por vez

    if (remindersError) {
      console.error('❌ Erro ao buscar lembretes:', remindersError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar lembretes' },
        { status: 500 }
      );
    }

    if (!reminders || reminders.length === 0) {
      console.log('✅ Nenhum lembrete pendente encontrado');
      return NextResponse.json({
        success: true,
        message: 'Nenhum lembrete pendente',
        processed: 0
      });
    }

    console.log(`📋 ${reminders.length} lembrete(s) encontrado(s) para processar`);

    let processed = 0;
    let errors = 0;

    // Processar cada lembrete
    for (const reminder of reminders) {
      try {
        // Verificar se o usuário tem telefone
        if (!reminder.profiles?.telefone) {
          console.log(`⚠️ Usuário ${reminder.profiles?.nome} não tem telefone`);
          
          // Marcar como enviado mesmo sem telefone para não tentar novamente
          await supabase
            .from('task_reminders')
            .update({ 
              sent: true, 
              sent_at: now.toISOString() 
            })
            .eq('id', reminder.id);
          
          continue;
        }

        // Preparar dados da tarefa para o lembrete
        const taskData = {
          taskId: reminder.task_id,
          taskTitle: reminder.tasks?.titulo || 'Tarefa',
          taskDescription: reminder.tasks?.descricao,
          projectName: reminder.tasks?.projects?.nome || 'Projeto',
          priority: reminder.tasks?.prioridade || 'MEDIA',
          deadline: reminder.tasks?.prazo,
          assignedUserId: reminder.user_id,
          assignedByName: 'Sistema de Lembretes',
          reminderType: reminder.reminder_type
        };

        console.log(`📱 Enviando lembrete ${reminder.reminder_type} para ${reminder.profiles.nome}`);

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

        if (whatsappResponse.ok && whatsappResult.success) {
          // Marcar lembrete como enviado
          await supabase
            .from('task_reminders')
            .update({ 
              sent: true, 
              sent_at: now.toISOString() 
            })
            .eq('id', reminder.id);

          // Log de sucesso
          await supabase
            .from('audit_logs')
            .insert([{
              user_id: reminder.user_id,
              recurso: 'task_reminder',
              recurso_id: reminder.task_id,
              acao: 'reminder_sent',
              payload: {
                reminder_id: reminder.id,
                reminder_type: reminder.reminder_type,
                task_title: reminder.tasks?.titulo,
                whatsapp_result: whatsappResult
              }
            }]);

          processed++;
          console.log(`✅ Lembrete enviado com sucesso para ${reminder.profiles.nome}`);

        } else {
          console.error(`❌ Erro ao enviar lembrete:`, whatsappResult);
          errors++;

          // Log de erro
          await supabase
            .from('audit_logs')
            .insert([{
              user_id: reminder.user_id,
              recurso: 'task_reminder',
              recurso_id: reminder.task_id,
              acao: 'reminder_failed',
              payload: {
                reminder_id: reminder.id,
                reminder_type: reminder.reminder_type,
                error: whatsappResult.error || 'Erro desconhecido'
              }
            }]);
        }

      } catch (error: any) {
        console.error(`💥 Erro ao processar lembrete ${reminder.id}:`, error);
        errors++;

        // Log de erro
        await supabase
          .from('audit_logs')
          .insert([{
            user_id: reminder.user_id,
            recurso: 'task_reminder',
            recurso_id: reminder.task_id,
            acao: 'reminder_error',
            payload: {
              reminder_id: reminder.id,
              error: error.message
            }
          }]);
      }
    }

    console.log(`✅ Processamento concluído: ${processed} enviados, ${errors} erros`);

    return NextResponse.json({
      success: true,
      message: 'Lembretes processados',
      processed,
      errors,
      total: reminders.length
    });

  } catch (error: any) {
    console.error('💥 Erro geral ao processar lembretes:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Erro geral no processamento de lembretes'
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status
export async function GET() {
  try {
    const now = new Date();
    
    // Contar lembretes pendentes
    const { count: pendingCount } = await supabase
      .from('task_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('sent', false)
      .lte('scheduled_time', now.toISOString());

    // Contar lembretes futuros
    const { count: futureCount } = await supabase
      .from('task_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('sent', false)
      .gt('scheduled_time', now.toISOString());

    return NextResponse.json({
      success: true,
      status: {
        pending_reminders: pendingCount || 0,
        future_reminders: futureCount || 0,
        current_time: now.toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}