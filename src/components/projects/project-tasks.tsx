"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { TaskDialog } from '@/components/tasks/task-dialog';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog'; // Importar o novo componente
import type { Database } from '@/types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface ProjectTasksProps {
  tasks: Task[];
  projectId: string;
  onTasksUpdate: () => void;
}

export function ProjectTasks({ tasks, projectId, onTasksUpdate }: ProjectTasksProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const supabase = createClient();

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (taskId: string) => {
    if (!confirm("Tem a certeza que quer apagar esta tarefa?")) {
      return;
    }
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast.success("Tarefa apagada com sucesso!");
      onTasksUpdate();
    } catch (error: any) {
      toast.error("Falha ao apagar a tarefa.", { description: error.message });
    }
  };

  return (
    <>
      <Card className="shadow-lg border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Tarefas do Projeto</CardTitle>
          <Button className="btn-premium" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-800">
                  <TableHead className="text-white">Título</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Data de Criação</TableHead>
                  <TableHead className="text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id} className="border-b border-slate-800 last:border-b-0">
                      <TableCell className="font-medium text-slate-200">{task.title}</TableCell>
                      <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(task.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(task)}>
                          <Pencil className="h-4 w-4 text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(task.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                      Nenhuma tarefa encontrada para este projeto.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Janela para criar nova tarefa */}
      <TaskDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onTaskCreated={onTasksUpdate}
        projectId={projectId}
      />

      {/* Janela para editar tarefa existente */}
      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onTaskUpdated={() => {
          setIsEditDialogOpen(false); // Fecha a janela
          onTasksUpdate(); // Atualiza a lista
        }}
        task={selectedTask}
      />
    </>
  );
}
