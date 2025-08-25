"use client";

import { ChevronDown, ChevronRight, ChefHat, FolderOpen, CheckSquare, Calendar, User, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import { Kitchen, Project, Task, TaskStatus, ProjectStatus } from '@/types/database';

interface TreeNodeProps {
  type: 'kitchen' | 'project' | 'task';
  data: Kitchen | Project | Task;
  level: number;
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
}

export function TreeNode({ type, data, level, expandedNodes, onToggleNode }: TreeNodeProps) {
  const nodeId = `${type}-${data.id}`;
  const isExpanded = expandedNodes.has(nodeId);
  const indent = level * 24;

  const getStatusBadge = (status: string, type: 'project' | 'task') => {
    if (type === 'project') {
      switch (status as ProjectStatus) {
        case 'ATIVO':
          return <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>;
        case 'PAUSADO':
          return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pausado</Badge>;
        case 'CONCLUIDO':
          return <Badge className="bg-gray-100 text-gray-800 text-xs">Concluído</Badge>;
      }
    } else {
      switch (status as TaskStatus) {
        case 'BACKLOG':
          return <Badge variant="outline" className="text-xs">Backlog</Badge>;
        case 'EM_ANDAMENTO':
          return <Badge className="bg-blue-100 text-blue-800 text-xs">Em Andamento</Badge>;
        case 'EM_REVISAO':
          return <Badge className="bg-purple-100 text-purple-800 text-xs">Em Revisão</Badge>;
        case 'CONCLUIDA':
          return <Badge className="bg-green-100 text-green-800 text-xs">Concluída</Badge>;
      }
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'MEDIA':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'BAIXA':
        return <AlertCircle className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  const renderKitchenNode = (kitchen: Kitchen & { projects: any[] }) => {
    const hasChildren = kitchen.projects.length > 0;
    const activeProjects = kitchen.projects.filter(p => p.status === 'ATIVO').length;
    const totalTasks = kitchen.projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = kitchen.projects.reduce((sum, p) => 
      sum + p.tasks.filter((t: Task) => t.status === 'CONCLUIDA').length, 0
    );

    return (
      <div className="space-y-2">
        <div 
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => hasChildren && onToggleNode(nodeId)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          <ChefHat className="h-5 w-5 text-blue-600" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {kitchen.nome}
              </span>
              <Badge variant="outline" className="text-xs">
                {kitchen.codigo}
              </Badge>
              {!kitchen.ativo && (
                <Badge variant="secondary" className="text-xs">Inativa</Badge>
              )}
            </div>
            {kitchen.endereco && (
              <p className="text-sm text-gray-500 truncate">{kitchen.endereco}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{activeProjects} projetos ativos</span>
            <span>{completedTasks}/{totalTasks} tarefas concluídas</span>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {kitchen.projects.map((project) => (
              <TreeNode
                key={project.id}
                type="project"
                data={project}
                level={level + 1}
                expandedNodes={expandedNodes}
                onToggleNode={onToggleNode}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectNode = (project: Project & { tasks: Task[] }) => {
    const hasChildren = project.tasks.length > 0;
    const completedTasks = project.tasks.filter(t => t.status === 'CONCLUIDA').length;
    const completionRate = hasChildren ? Math.round((completedTasks / project.tasks.length) * 100) : 0;

    return (
      <div className="space-y-2">
        <div 
          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => hasChildren && onToggleNode(nodeId)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          <FolderOpen className="h-4 w-4 text-orange-600" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {project.nome}
              </span>
              {getStatusBadge(project.status, 'project')}
            </div>
            {project.descricao && (
              <p className="text-sm text-gray-500 line-clamp-1">{project.descricao}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {hasChildren && (
              <span>{completionRate}% concluído</span>
            )}
            <span>{project.tasks.length} tarefas</span>
            {project.fim_previsto && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(project.fim_previsto)}
              </span>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {project.tasks.map((task) => (
              <TreeNode
                key={task.id}
                type="task"
                data={task}
                level={level + 1}
                expandedNodes={expandedNodes}
                onToggleNode={onToggleNode}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTaskNode = (task: Task & { responsavel?: any }) => {
    const isOverdue = task.prazo && new Date(task.prazo) < new Date() && task.status !== 'CONCLUIDA';

    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800",
          isOverdue && "bg-red-50 dark:bg-red-950 border border-red-200"
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
      >
        <div className="w-4 h-4" />
        
        <CheckSquare className={cn(
          "h-4 w-4",
          task.status === 'CONCLUIDA' ? "text-green-600" : "text-gray-400"
        )} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm",
              task.status === 'CONCLUIDA' ? "line-through text-gray-500" : "text-gray-900 dark:text-white"
            )}>
              {task.titulo}
            </span>
            {getPriorityIcon(task.prioridade)}
            {getStatusBadge(task.status, 'task')}
          </div>
          {task.descricao && (
            <p className="text-xs text-gray-500 line-clamp-1">{task.descricao}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.responsavel && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs">
                  {task.responsavel.nome?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{task.responsavel.nome}</span>
            </div>
          )}
          {task.prazo && (
            <span className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-600 font-medium"
            )}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.prazo)}
              {isOverdue && " (Atrasada)"}
            </span>
          )}
        </div>
      </div>
    );
  };

  switch (type) {
    case 'kitchen':
      return renderKitchenNode(data as Kitchen & { projects: any[] });
    case 'project':
      return renderProjectNode(data as Project & { tasks: Task[] });
    case 'task':
      return renderTaskNode(data as Task & { responsavel?: any });
    default:
      return null;
  }
}