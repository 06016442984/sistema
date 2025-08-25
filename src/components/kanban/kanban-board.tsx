"use client";

import { useState } from 'react';
import { MoreVertical, Edit, Trash2, User, Calendar, Flag, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Task, TaskStatus, TaskPriority } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface TaskWithRelations extends Task {
  projects: any;
  responsavel?: any;
  criador?: any;
}

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskEdit: (task: Task) => void;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const statusColumns = [
  { 
    id: 'BACKLOG', 
    title: 'Backlog', 
    icon: FileText,
    className: 'backlog',
    color: '#64748b'
  },
  { 
    id: 'EM_ANDAMENTO', 
    title: 'Em Andamento', 
    icon: Clock,
    className: 'in-progress',
    color: '#3b82f6'
  },
  { 
    id: 'EM_REVISAO', 
    title: 'Em Revisão', 
    icon: AlertCircle,
    className: 'review',
    color: '#f59e0b'
  },
  { 
    id: 'CONCLUIDA', 
    title: 'Concluída', 
    icon: CheckCircle,
    className: 'completed',
    color: '#10b981'
  },
];

export function KanbanBoard({ tasks, onTaskEdit, onTaskStatusChange }: KanbanBoardProps) {
  const { userRoles } = useAuth();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;

      toast.success('Tarefa excluída com sucesso!');
      // Recarregar tarefas
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    } finally {
      setTaskToDelete(null);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'ALTA':
        return <span className="priority-high">Alta</span>;
      case 'MEDIA':
        return <span className="priority-medium">Média</span>;
      case 'BAIXA':
        return <span className="priority-low">Baixa</span>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const canDeleteTasks = userRoles.some(role => 
    role.role === 'ADMIN' || role.role === 'SUPERVISORA'
  );

  const handleDragStart = (e: React.DragEvent, task: TaskWithRelations) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain');
    onTaskStatusChange(taskId, newStatus);
  };

  return (
    <div className="kanban-container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter(task => task.status === column.id);
          const IconComponent = column.icon;
          
          return (
            <div
              key={column.id}
              className={`kanban-column ${column.className}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id as TaskStatus)}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="flex items-center">
                  <IconComponent className="column-icon" />
                  <h3 className="font-semibold text-white">
                    {column.title}
                  </h3>
                </div>
                <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {columnTasks.length}
                </div>
              </div>

              {/* Column Content */}
              <div className="kanban-column-content">
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`task-card status-${column.className}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sm text-white line-clamp-2 flex-1 mr-2">
                          {task.titulo}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem onClick={() => onTaskEdit(task)} className="text-gray-200 hover:bg-gray-700">
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {canDeleteTasks && (
                              <DropdownMenuItem 
                                onClick={() => setTaskToDelete(task)}
                                className="text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Task Description */}
                      {task.descricao && (
                        <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                          {task.descricao}
                        </p>
                      )}

                      {/* Priority and Project */}
                      <div className="flex items-center justify-between mb-3">
                        {getPriorityBadge(task.prioridade)}
                        <Badge variant="outline" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                          {task.projects.nome}
                        </Badge>
                      </div>

                      {/* Assignee */}
                      {task.responsavel && (
                        <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                          <User className="h-4 w-4" />
                          <span>{task.responsavel.nome}</span>
                        </div>
                      )}

                      {/* Due Date */}
                      {task.prazo && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span className={`${
                            new Date(task.prazo) < new Date() && task.status !== 'CONCLUIDA' 
                              ? 'text-red-400 font-medium' 
                              : 'text-gray-300'
                          }`}>
                            {formatDate(task.prazo)}
                          </span>
                          {new Date(task.prazo) < new Date() && task.status !== 'CONCLUIDA' && (
                            <Flag className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir a tarefa "{taskToDelete?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}