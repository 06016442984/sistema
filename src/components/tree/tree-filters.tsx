"use client";

import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { TaskStatus, ProjectStatus } from '@/types/database';

interface TreeFiltersProps {
  filters: {
    projectStatus: ProjectStatus[];
    taskStatus: TaskStatus[];
    showEmptyProjects: boolean;
    showCompletedTasks: boolean;
  };
  onFiltersChange: (filters: {
    projectStatus: ProjectStatus[];
    taskStatus: TaskStatus[];
    showEmptyProjects: boolean;
    showCompletedTasks: boolean;
  }) => void;
}

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'CONCLUIDO', label: 'Concluído' },
];

const taskStatusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'EM_REVISAO', label: 'Em Revisão' },
  { value: 'CONCLUIDA', label: 'Concluída' },
];

export function TreeFilters({ filters, onFiltersChange }: TreeFiltersProps) {
  const updateProjectStatusFilter = (newProjectStatus: ProjectStatus[]) => {
    onFiltersChange({
      ...filters,
      projectStatus: newProjectStatus,
    });
  };

  const updateTaskStatusFilter = (newTaskStatus: TaskStatus[]) => {
    onFiltersChange({
      ...filters,
      taskStatus: newTaskStatus,
    });
  };

  const updateBooleanFilter = (key: 'showEmptyProjects' | 'showCompletedTasks', value: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleProjectStatusFilter = (value: ProjectStatus) => {
    const currentArray = filters.projectStatus;
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateProjectStatusFilter(newArray);
  };

  const toggleTaskStatusFilter = (value: TaskStatus) => {
    const currentArray = filters.taskStatus;
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateTaskStatusFilter(newArray);
  };

  const clearFilters = () => {
    onFiltersChange({
      projectStatus: [],
      taskStatus: [],
      showEmptyProjects: true,
      showCompletedTasks: true,
    });
  };

  const hasActiveFilters = 
    filters.projectStatus.length > 0 ||
    filters.taskStatus.length > 0 ||
    !filters.showEmptyProjects ||
    !filters.showCompletedTasks;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros da Árvore</CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Project Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status dos Projetos</Label>
            <div className="space-y-2">
              {projectStatusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-status-${option.value}`}
                    checked={filters.projectStatus.includes(option.value)}
                    onCheckedChange={() => toggleProjectStatusFilter(option.value)}
                  />
                  <Label
                    htmlFor={`project-status-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Task Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status das Tarefas</Label>
            <div className="space-y-2">
              {taskStatusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`task-status-${option.value}`}
                    checked={filters.taskStatus.includes(option.value)}
                    onCheckedChange={() => toggleTaskStatusFilter(option.value)}
                  />
                  <Label
                    htmlFor={`task-status-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Opções de Exibição</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-empty-projects" className="text-sm font-normal">
                  Mostrar projetos vazios
                </Label>
                <Switch
                  id="show-empty-projects"
                  checked={filters.showEmptyProjects}
                  onCheckedChange={(checked) => updateBooleanFilter('showEmptyProjects', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-completed-tasks" className="text-sm font-normal">
                  Mostrar tarefas concluídas
                </Label>
                <Switch
                  id="show-completed-tasks"
                  checked={filters.showCompletedTasks}
                  onCheckedChange={(checked) => updateBooleanFilter('showCompletedTasks', checked)}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ações Rápidas</Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => updateTaskStatusFilter(['BACKLOG', 'EM_ANDAMENTO', 'EM_REVISAO'])}
              >
                Apenas tarefas pendentes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => updateProjectStatusFilter(['ATIVO'])}
              >
                Apenas projetos ativos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  updateBooleanFilter('showEmptyProjects', false);
                  updateBooleanFilter('showCompletedTasks', false);
                }}
              >
                Ocultar vazios/concluídos
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}