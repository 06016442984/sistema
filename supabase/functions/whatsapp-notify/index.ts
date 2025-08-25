import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { taskData } = await req.json()
    
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') 
    const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Received task data:', taskData)

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Evolution API não configurada' 
        }),
        { headers: corsHeaders, status: 400 }
      )
    }

    // Buscar usuário
    const userUrl = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${taskData.assignedUserId}&select=nome,telefone`
    const userResponse = await fetch(userUrl, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    })

    const users = await userResponse.json()
    
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não encontrado' 
        }),
        { headers: corsHeaders, status: 404 }
      )
    }

    const user = users[0]

    if (!user.telefone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Usuário não tem telefone cadastrado' 
        }),
        { headers: corsHeaders }
      )
    }

    // Formatar telefone
    let phone = user.telefone.replace(/\D/g, '')
    if (!phone.startsWith('55') && phone.length === 11) {
      phone = '55' + phone
    }

    // Criar mensagem
    const message = `🎯 *Nova Tarefa Atribuída*

📋 *Título:* ${taskData.taskTitle}
🏢 *Projeto:* ${taskData.projectName}
👤 *Atribuída por:* ${taskData.assignedByName}

✅ Acesse o sistema para mais detalhes.`

    // Enviar WhatsApp
    const evolutionUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`
    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: phone,
        text: message
      })
    })

    const result = await evolutionResponse.json()

    if (!evolutionResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Evolution API error: ${result.message || 'Erro desconhecido'}` 
        }),
        { headers: corsHeaders, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp enviado com sucesso',
        messageId: result.key?.id,
        phone: phone
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: corsHeaders, status: 500 }
    )
  }
})