"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Database,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DebugInfo {
  pendingReminders: number;
  futureReminders: number;
  recentLogs: any[];
  tasks: any[];
}

export default function NotificationsDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    pendingReminders: 0,
    futureReminders: 0,
    recentLogs: [],
    tasks: []
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      
      // Buscar lembretes pendentes
      const now = new Date().toISOString();
      const { count: pendingCount } = await supabase
        .from('task_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('sent', false)
        .lte('scheduled_time', now);

      // Buscar lembretes futuros
      const { count: futureCount } = await supabase
        .from('task_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('sent', false)
        .gt('scheduled_time', now);

      // Buscar logs recentes
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .in('recurso', ['whatsapp_notification', 'task_assignment', 'task_reminder'])
        .order('criado_em', { ascending: false })
        .limit(10);

      // Buscar tarefas recentes com responsável
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id,
          titulo,
          prioridade,
          responsavel_id,
          criado_em,
          profiles!tasks_responsavel_id_fkey (nome, telefone)
        `)
        .not('responsavel_id', 'is', null)
        .order('criado_em', { ascending: false })
        .limit(5);

      setDebugInfo({
        pendingReminders: pendingCount || 0,
        futureReminders: futureCount || 0,
        recentLogs: logs || [],
        tasks: tasks || []
      });

    } catch (error: any) {
      console.error('❌ Erro ao carregar debug info:', error);
      toast.error('Erro ao carregar informações de debug');
    } finally {
      setLoading(false);
    }
  };

  const testNotificationSystem = async () => {
    try {
      setTesting(true);
      toast.info('🧪 Testando sistema de notificações...');

      // Testar API de processamento de lembretes
      const response = await fetch('/api/process-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('📥 Resultado do teste:', result);

      if (result.success) {
        toast.success(`✅ Sistema funcionando! ${result.processed} lembretes processados`);
      } else {
        toast.error(`❌ Erro no sistema: ${result.error}`);
      }

      // Recarregar informações
      await loadDebugInfo();

    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testWhatsAppAPI = async () => {
    try {
      toast.info('📱 Testando API WhatsApp...');

      // Buscar primeira tarefa com responsável
      const taskWithUser = debugInfo.tasks[0];
      if (!taskWithUser) {
        toast.error('❌ Nenhuma tarefa com responsável encontrada');
        return;
      }

      const taskData = {
        taskId: taskWithUser.id,
        taskTitle: taskWithUser.titulo,
        taskDescription: 'Teste de notificação',
        projectName: 'Projeto Teste',
        priority: taskWithUser.prioridade,
        deadline: null,
        assignedUserId: taskWithUser.responsavel_id,
        assignedByName: 'Sistema de Teste',
        reminderType: 'DELEGACAO'
      };

      const response = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskData }),
      });

      const result = await response.json();
      console.log('📥 Resultado WhatsApp:', result);

      if (result.success) {
        toast.success(`✅ WhatsApp enviado para ${taskWithUser.profiles?.nome}!`);
      } else {
        toast.error(`❌ Erro WhatsApp: ${result.error}`);
      }

    } catch (error: any) {
      console.error('❌ Erro no teste WhatsApp:', error);
      toast.error(`❌ Erro: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug - Sistema de Notificações</h1>
          <p className="text-gray-600 mt-2">
            Diagnóstico e teste do sistema de notificações WhatsApp
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadDebugInfo} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button onClick={testNotificationSystem} disabled={testing}>
            {testing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bug className="h-4 w-4 mr-2" />
            )}
            Testar Sistema
          </Button>

          <Button onClick={testWhatsAppAPI} variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Testar WhatsApp
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Lembretes Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {debugInfo.pendingReminders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Lembretes Futuros</p>
                <p className="text-2xl font-bold text-blue-600">
                  {debugInfo.futureReminders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Logs Recentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {debugInfo.recentLogs.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tarefas Ativas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {debugInfo.tasks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas Recentes com Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {debugInfo.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{task.titulo}</h4>
                  <p className="text-sm text-gray-600">
                    Responsável: {task.profiles?.nome || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Criado em: {formatDate(task.criado_em)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={task.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                  >
                    {task.prioridade}
                  </Badge>
                  
                  {task.profiles?.telefone ? (
                    <Badge variant="outline" className="text-green-600">
                      📱 Com telefone
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">
                      ❌ Sem telefone
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {debugInfo.tasks.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nenhuma tarefa com responsável encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Notificações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {debugInfo.recentLogs.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {log.recurso}
                    </Badge>
                    <Badge 
                      variant={log.acao.includes('success') || log.acao.includes('sent') ? 'default' : 'secondary'}
                    >
                      {log.acao}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(log.criado_em)}
                  </span>
                </div>
                
                {log.payload && (
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            
            {debugInfo.recentLogs.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nenhum log de notificação encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Como Diagnosticar Problemas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <div className="space-y-2">
            <p><strong>1. Verificar Lembretes Pendentes:</strong> Se há lembretes que deveriam ter sido enviados</p>
            <p><strong>2. Testar Sistema:</strong> Processa lembretes pendentes manualmente</p>
            <p><strong>3. Testar WhatsApp:</strong> Envia uma notificação de teste</p>
            <p><strong>4. Verificar Logs:</strong> Analisa erros e sucessos recentes</p>
            <p><strong>5. Verificar Telefones:</strong> Usuários precisam ter telefone cadastrado</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}