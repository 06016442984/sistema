"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  MoreHorizontal,
  User,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  status: string;
  responsavel_id?: string;
  prazo?: string;
  comentarios?: number;
  anexos?: number;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
  users: Array<{ id: string; nome: string; email: string }>;
  projectName?: string;
}

const priorityColors = {
  BAIXA: 'bg-green-100 text-green-800 border-green-200',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ALTA: 'bg-red-100 text-red-800 border-red-200',
};

const priorityLabels = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
};

// Função para carregar configurações do WhatsApp de forma segura
function loadWhatsAppConfigSafely() {
  try {
    if (typeof window === 'undefined') {
      return {
        apiUrl: 'https://n88n-evolution-api.tijjpa.easypanel.host',
        apiKey: '5746D991B38B-4181-9C59-C725B6537292',
        instanceName: 'educafit'
      };
    }

    const savedConfig = localStorage.getItem('whatsapp_evolution_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed && parsed.apiUrl && parsed.apiKey && parsed.instanceName) {
        // Atualizar API Key se estiver usando as antigas
        if (parsed.apiKey === '05F9D81C8C09-441A-B724-1558572D1281' || 
            parsed.apiKey === 'B6D711FCDE46-4F71-B1D7-438BDCAE6008') {
          parsed.apiKey = '5746D991B38B-4181-9C59-C725B6537292';
          localStorage.setItem('whatsapp_evolution_config', JSON.stringify(parsed));
          console.log('🔄 API Key atualizada automaticamente no TaskCard para a correta');
        }
        
        return {
          apiUrl: parsed.apiUrl,
          apiKey: parsed.apiKey,
          instanceName: parsed.instanceName
        };
      }
    }

    return {
      apiUrl: 'https://n88n-evolution-api.tijjpa.easypanel.host',
      apiKey: '5746D991B38B-4181-9C59-C725B6537292',
      instanceName: 'educafit'
    };
  } catch (error) {
    console.warn('⚠️ Erro ao carregar configurações WhatsApp, usando padrão:', error);
    return {
      apiUrl: 'https://n88n-evolution-api.tijjpa.easypanel.host',
      apiKey: '5746D991B38B-4181-9C59-C725B6537292',
      instanceName: 'educafit'
    };
  }
}

// Função para determinar o tipo de lembrete baseado no status
function getReminderTypeByStatus(status: string): string {
  switch (status) {
    case 'EM_ANDAMENTO':
      return 'ANDAMENTO';
    case 'EM_REVISAO':
      return 'REVISAO';
    case 'CONCLUIDA':
      return 'FINALIZADA';
    default:
      return 'DELEGACAO';
  }
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onAssigneeChange, 
  users,
  projectName 
}: TaskCardProps) {
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const assignedUser = users.find(user => user.id === task.responsavel_id);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Verificar se deve mostrar botão WhatsApp (tem responsável e está em status que permite notificação)
  const canSendWhatsApp = task.responsavel_id && ['EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA'].includes(task.status);

  const sendWhatsAppNotification = async () => {
    if (!task.responsavel_id) {
      toast.error('❌ Tarefa não tem responsável atribuído');
      return;
    }

    setSendingWhatsApp(true);
    try {
      // Carregar configurações de forma segura
      const whatsappConfig = loadWhatsAppConfigSafely();
      
      console.log('📱  Enviando notificação WhatsApp...');
      console.log('🔑 Usando API Key:', whatsappConfig.apiKey.substring(0, 8) + '...');

      const reminderType = getReminderTypeByStatus(task.status);

      const taskData = {
        taskId: task.id,
        taskTitle: task.titulo,
        taskDescription: task.descricao || '',
        projectName: projectName || 'Projeto',
        priority: task.prioridade,
        deadline: task.prazo || null,
        assignedUserId: task.responsavel_id,
        assignedByName: 'Sistema',
        reminderType: reminderType
      };

      const response = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          taskData,
          evolutionConfig: {
            API_URL: whatsappConfig.apiUrl,
            API_KEY: whatsappConfig.apiKey,
            DEFAULT_INSTANCE: whatsappConfig.instanceName
          }
        }),
      });

      const result = await response.json();
      console.log('📥 Resultado do envio:', result);

      if (result.success) {
        toast.success(`✅ Notificação WhatsApp enviada para ${assignedUser?.nome}!`);
      } else {
        if (response.status === 401) {
          toast.error('🔑 API Key inválida - Vá em Configurações > WhatsApp para atualizar');
        } else {
          toast.error(`❌ Erro: ${result.error || 'Falha no envio'}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com título e menu */}
          <div className="flex items-start justify-between">
            <h3 
              className="font-medium text-gray-900 line-clamp-2 flex-1 mr-2"
              onClick={() => onEdit(task)}
            >
              {task.titulo}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Editar tarefa
                </DropdownMenuItem>
                {canSendWhatsApp && (
                  <DropdownMenuItem 
                    onClick={sendWhatsAppNotification}
                    disabled={sendingWhatsApp}
                  >
                    {sendingWhatsApp ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-3 w-3" />
                        Enviar WhatsApp
                      </div>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  Excluir tarefa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Descrição */}
          {task.descricao && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.descricao}
            </p>
          )}

          {/* Prioridade */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium",
                priorityColors[task.prioridade]
              )}
            >
              {priorityLabels[task.prioridade]}
            </Badge>
          </div>

          {/* Prazo */}
          {task.prazo && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(task.prazo)}
              </span>
            </div>
          )}

          {/* Responsável */}
          {assignedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {assignedUser.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 truncate">
                {assignedUser.nome}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <User className="h-4 w-4" />
              <span className="text-sm">Não atribuído</span>
            </div>
          )}

          {/* Footer com ações */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-400">
              {task.comentarios && task.comentarios > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-xs">{task.comentarios}</span>
                </div>
              )}
              {task.anexos && task.anexos > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span className="text-xs">{task.anexos}</span>
                </div>
              )}
            </div>

            {/* Botão de WhatsApp rápido */}
            {canSendWhatsApp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={sendWhatsAppNotification}
                disabled={sendingWhatsApp}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Enviar notificação WhatsApp"
              >
                {sendingWhatsApp ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}