"use client";

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Task, Project, Profile, ProjectFile, TaskFile } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

import { TaskDetailsForm } from '@/components/task-dialog/task-details-form';
import { TaskFilesTab } from '@/components/task-dialog/task-files-tab';
import { useTaskDialog } from '@/hooks/use-task-dialog';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projects: Project[];
  users: Profile[];
  onSaved: () => void;
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

export function TaskDialog({ open, onOpenChange, task, projects, users, onSaved }: TaskDialogProps) {
  const { user } = useAuth();
  const {
    loading,
    loadingUsers,
    sendingWhatsApp,
    setSendingWhatsApp,
    date,
    setDate,
    availableUsers,
    availableProjects,
    availableKitchens,
    projectFiles,
    taskFiles,
    uploadingTaskFile,
    setUploadingTaskFile,
    selectedTaskFile,
    setSelectedTaskFile,
    formData,
    handleFormDataChange,
    handleKitchenChange,
    handleProjectChange,
    handleSubmit,
    loadTaskFiles
  } = useTaskDialog({ open, task, projects, onSaved });

  const uploadTaskFile = async () => {
    if (!selectedTaskFile || !user || !task) {
      toast.error('Selecione um arquivo e salve a tarefa primeiro');
      return;
    }

    try {
      setUploadingTaskFile(true);

      const fileExt = selectedTaskFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `tasks/${task.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, selectedTaskFile);

      if (uploadError) throw uploadError;

      const fileData = {
        task_id: task.id,
        nome_arquivo: fileName,
        nome_original: selectedTaskFile.name,
        tipo_arquivo: selectedTaskFile.type,
        tamanho_bytes: selectedTaskFile.size,
        file_path: filePath,
        uploaded_by: user.id,
      };

      const { error: insertError } = await supabase
        .from('task_files')
        .insert([fileData]);

      if (insertError) throw insertError;

      toast.success('Arquivo enviado com sucesso!');
      setSelectedTaskFile(null);
      loadTaskFiles(task.id);

    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploadingTaskFile(false);
    }
  };

  const downloadFile = async (file: ProjectFile | TaskFile, bucket: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.nome_original;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const sendManualWhatsApp = useCallback(async () => {
    if (!task || !formData.responsavel_id) {
      toast.error('Salve a tarefa primeiro e selecione um responsável');
      return;
    }

    setSendingWhatsApp(true);
    try {
      const reminderType = getReminderTypeByStatus(formData.status);

      const response = await fetch('/api/manual-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          assignedUserId: formData.responsavel_id,
          assignedByName: user?.user_metadata?.nome || user?.email || 'Sistema',
          reminderType: reminderType
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('📱 WhatsApp enviado com sucesso!');
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setSendingWhatsApp(false);
    }
  }, [task, formData.responsavel_id, formData.status, user, setSendingWhatsApp]);

  const getSelectedUser = useCallback(() => {
    return availableUsers.find(u => u.id === formData.responsavel_id);
  }, [availableUsers, formData.responsavel_id]);

  const selectedUser = getSelectedUser();

  // Verificar se deve mostrar botão WhatsApp
  const canSendWhatsApp = task && formData.responsavel_id && selectedUser?.telefone && 
    ['EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA'].includes(formData.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Atualize as informações da tarefa.'
              : 'Crie uma nova tarefa para o projeto.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <TaskDetailsForm
                formData={formData}
                date={date}
                availableKitchens={availableKitchens}
                availableProjects={availableProjects}
                availableUsers={availableUsers}
                loadingUsers={loadingUsers}
                onFormDataChange={handleFormDataChange}
                onDateChange={setDate}
                onKitchenChange={handleKitchenChange}
                onProjectChange={handleProjectChange}
              />
            </form>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <TaskFilesTab
              projectFiles={projectFiles}
              taskFiles={taskFiles}
              taskExists={!!task}
              selectedTaskFile={selectedTaskFile}
              uploadingTaskFile={uploadingTaskFile}
              onTaskFileSelect={setSelectedTaskFile}
              onTaskFileUpload={uploadTaskFile}
              onProjectFileDownload={(file) => downloadFile(file, 'project-files')}
              onTaskFileDownload={(file) => downloadFile(file, 'task-files')}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* WhatsApp Manual */}
          {canSendWhatsApp && (
            <Button
              type="button"
              variant="outline"
              onClick={sendManualWhatsApp}
              disabled={sendingWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              {sendingWhatsApp ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Enviar WhatsApp
                </div>
              )}
            </Button>
          )}
          
          <div className="flex gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || loadingUsers || availableKitchens.length === 0}
            >
              {loading ? 'Salvando...' : (task ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}