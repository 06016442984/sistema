import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para carregar configurações salvas
function getEvolutionConfig() {
  // Configurações padrão com API Key correta
  const defaultConfig = {
    API_URL: 'https://n88n-evolution-api.tijjpa.easypanel.host',
    API_KEY: '5746D991B38B-4181-9C59-C725B6537292',
    DEFAULT_INSTANCE: 'educafit'
  };

  try {
    return defaultConfig;
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error);
    return defaultConfig;
  }
}

// Função para encontrar instância ativa
async function findActiveInstance(config: any): Promise<string> {
  try {
    console.log('🔍 Buscando instância ativa...');
    
    const response = await fetch(`${config.API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.API_KEY,
        'Authorization': `Bearer ${config.API_KEY}`,
      },
    });

    if (response.ok) {
      const instances = await response.json();
      console.log('📋 Instâncias encontradas:', instances);
      
      // Procurar por instância configurada primeiro
      const configuredInstance = instances.find((inst: any) => {
        const instanceName = inst.instance?.instanceName || inst.instanceName;
        const instanceState = inst.instance?.state || inst.state;
        return instanceName === config.DEFAULT_INSTANCE && instanceState === 'open';
      });
      
      if (configuredInstance) {
        console.log('✅ Instância configurada encontrada e ativa:', config.DEFAULT_INSTANCE);
        return config.DEFAULT_INSTANCE;
      }
      
      // Se não, procurar qualquer instância ativa
      const activeInstance = instances.find((inst: any) => {
        const instanceState = inst.instance?.state || inst.state;
        return instanceState === 'open';
      });
      
      if (activeInstance) {
        const instanceName = activeInstance.instance?.instanceName || activeInstance.instanceName;
        console.log(`✅ Instância ativa encontrada: ${instanceName}`);
        return instanceName;
      }
      
      // Se nenhuma estiver ativa, usar a primeira disponível
      if (instances.length > 0) {
        const instanceName = instances[0].instance?.instanceName || instances[0].instanceName || config.DEFAULT_INSTANCE;
        console.log(`⚠️ Usando primeira instância disponível: ${instanceName}`);
        return instanceName;
      }
    }
    
    console.log('⚠️ Nenhuma instância encontrada, usando padrão');
    return config.DEFAULT_INSTANCE;
    
  } catch (error) {
    console.error('❌ Erro ao buscar instâncias:', error);
    return config.DEFAULT_INSTANCE;
  }
}

// Função para formatar mensagem baseada no tipo de lembrete
function formatMessage(taskData: any): string {
  const priorityEmoji = {
    'ALTA': '🔴',
    'MEDIA': '🟡', 
    'BAIXA': '🟢'
  };

  const deadlineText = taskData.deadline 
    ? `\n📅 *Prazo:* ${new Date(taskData.deadline).toLocaleDateString('pt-BR')}`
    : '';

  const reminderTypeMessages = {
    'DELEGACAO': `🎯 *Nova Tarefa Atribuída*`,
    'INICIO_JORNADA': `🌅 *Lembrete - Início da Jornada*`,
    'MEIO_JORNADA': `☀️ *Lembrete - Meio da Jornada*`,
    'FIM_JORNADA': `🌆 *Lembrete - Fim da Jornada*`
  };

  const reminderTypeTexts = {
    'DELEGACAO': 'Uma nova tarefa foi atribuída a você.',
    'INICIO_JORNADA': 'Lembrete para verificar suas tarefas no início da jornada.',
    'MEIO_JORNADA': 'Lembrete para acompanhar o progresso de suas tarefas.',
    'FIM_JORNADA': 'Lembrete para finalizar ou atualizar suas tarefas antes do fim da jornada.'
  };

  const reminderType = taskData.reminderType || 'DELEGACAO';
  const title = reminderTypeMessages[reminderType as keyof typeof reminderTypeMessages] || reminderTypeMessages.DELEGACAO;
  const description = reminderTypeTexts[reminderType as keyof typeof reminderTypeTexts] || reminderTypeTexts.DELEGACAO;

  return `${title}

📋 *Tarefa:* ${taskData.taskTitle}

🏢 *Projeto:* ${taskData.projectName}

${priorityEmoji[taskData.priority as keyof typeof priorityEmoji] || '⚪'} *Prioridade:* ${taskData.priority}${deadlineText}

👤 *Atribuída por:* ${taskData.assignedByName}

${taskData.taskDescription ? `📝 *Descrição:* ${taskData.taskDescription}\n` : ''}
💡 ${description}

✅ Acesse o sistema para mais detalhes e atualizações.`;
}

export async function POST(request: NextRequest) {
  try {
    const { taskData, evolutionConfig } = await request.json();

    if (!taskData || !taskData.assignedUserId) {
      return NextResponse.json(
        { success: false, error: 'Dados da tarefa são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('📋 Processando tarefa:', taskData);

    // Usar configurações fornecidas ou carregar padrão
    const config = evolutionConfig || getEvolutionConfig();
    
    // Garantir que a API Key seja válida
    if (!config.API_KEY || config.API_KEY.length < 10) {
      config.API_KEY = '5746D991B38B-4181-9C59-C725B6537292'; // Fallback para API Key correta
    }
    
    console.log('⚙️ Usando configurações:', {
      API_URL: config.API_URL,
      API_KEY: config.API_KEY?.substring(0, 8) + '...',
      DEFAULT_INSTANCE: config.DEFAULT_INSTANCE
    });

    // Buscar dados do usuário
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('nome, telefone, email')
      .eq('id', taskData.assignedUserId)
      .single();

    if (userError || !userProfile) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('👤 Usuário encontrado:', userProfile.nome);

    // Verificar se tem telefone
    if (!userProfile.telefone) {
      console.log('⚠️ Usuário não tem telefone cadastrado');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Usuário não tem telefone cadastrado',
          userEmail: userProfile.email
        },
        { status: 200 }
      );
    }

    // Encontrar instância ativa
    const activeInstance = await findActiveInstance(config);
    console.log('🎯 Usando instância:', activeInstance);

    // Formatar número de telefone
    let phoneNumber = userProfile.telefone.replace(/\D/g, '');
    
    // Se não começar com código do país, assumir Brasil (+55)
    if (!phoneNumber.startsWith('55') && phoneNumber.length === 11) {
      phoneNumber = '55' + phoneNumber;
    }
    
    console.log('📱 Enviando para:', phoneNumber);

    // Formatar mensagem baseada no tipo de lembrete
    const message = formatMessage(taskData);

    // Enviar via Evolution API com headers corretos
    const evolutionUrl = `${config.API_URL}/message/sendText/${activeInstance}`;
    
    const evolutionPayload = {
      number: phoneNumber,
      text: message
    };

    console.log('🔄 Enviando para Evolution API:', evolutionUrl);
    console.log('📤 Tipo de lembrete:', taskData.reminderType || 'DELEGACAO');
    console.log('🔑 API Key sendo usada:', config.API_KEY?.substring(0, 8) + '...');

    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.API_KEY,
        'Authorization': `Bearer ${config.API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(evolutionPayload)
    });

    const evolutionResult = await evolutionResponse.json();
    console.log('📥 Resposta Evolution API:', evolutionResult);
    console.log('📊 Status HTTP:', evolutionResponse.status);

    if (!evolutionResponse.ok) {
      console.error('❌ Erro da Evolution API:', evolutionResult);
      
      // Tratamento específico para erro 401
      if (evolutionResponse.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'API Key inválida ou expirada. Verifique as configurações.',
            details: 'Erro 401: Unauthorized - A chave da API não é válida ou não tem permissões necessárias.'
          },
          { status: 401 }
        );
      }
      
      throw new Error(`Erro da Evolution API (${evolutionResponse.status}): ${evolutionResult.message || evolutionResult.error || 'Erro desconhecido'}`);
    }

    // Verificar se a mensagem foi enviada com sucesso
    if (!evolutionResult.key || !evolutionResult.key.id) {
      console.error('❌ Resposta inválida da Evolution API:', evolutionResult);
      throw new Error('Resposta inválida da Evolution API');
    }

    console.log('✅ WhatsApp enviado com sucesso:', evolutionResult.key.id);

    // Registrar log da notificação
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: taskData.assignedUserId,
        recurso: 'whatsapp_notification',
        recurso_id: taskData.taskId,
        acao: taskData.reminderType || 'task_assigned',
        payload: {
          message_id: evolutionResult.key.id,
          phone_number: phoneNumber,
          task_title: taskData.taskTitle,
          project_name: taskData.projectName,
          reminder_type: taskData.reminderType || 'DELEGACAO',
          instance_used: activeInstance,
          evolution_response: evolutionResult,
          config_used: {
            api_url: config.API_URL,
            instance: activeInstance
          }
        }
      }]);

    if (logError) {
      console.error('⚠️ Erro ao registrar log:', logError);
    } else {
      console.log('📝 Log registrado com sucesso');
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp enviado com sucesso via Evolution API',
      messageId: evolutionResult.key.id,
      phoneNumber: phoneNumber,
      reminderType: taskData.reminderType || 'DELEGACAO',
      instanceUsed: activeInstance,
      configUsed: {
        apiUrl: config.API_URL,
        instance: activeInstance
      },
      evolutionResponse: evolutionResult
    });

  } catch (error: any) {
    console.error('💥 Erro ao enviar WhatsApp:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Verifique as configurações da Evolution API e os dados do usuário'
      },
      { status: 500 }
    );
  }
}