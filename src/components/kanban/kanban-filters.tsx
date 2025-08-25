"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, User, Filter, Search, Building } from 'lucide-react';
import { TaskStatus, TaskPriority, Profile, Kitchen } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';

interface KanbanFiltersProps {
  filters: {
    status: TaskStatus[];
    priority: TaskPriority[];
    responsavel_id: string[];
    kitchen_id: string[];
    prazo_inicio: string;
    prazo_fim: string;
    minhas_tarefas: boolean;
  };
  onFiltersChange: (filters: any) => void;
  users: Profile[];
  kitchens: Kitchen[];
}

export function KanbanFilters({ filters, onFiltersChange, users, kitchens }: KanbanFiltersProps) {
  const { user } = useAuth();

  const handleStatusChange = (status: TaskStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    
    onFiltersChange({ ...filters, priority: newPriority });
  };

  const handleResponsavelChange = (userId: string) => {
    const newResponsavel = filters.responsavel_id.includes(userId)
      ? filters.responsavel_id.filter(id => id !== userId)
      : [...filters.responsavel_id, userId];
    
    onFiltersChange({ ...filters, responsavel_id: newResponsavel });
  };

  const handleKitchenChange = (kitchenId: string) => {
    const newKitchens = filters.kitchen_id.includes(kitchenId)
      ? filters.kitchen_id.filter(id => id !== kitchenId)
      : [...filters.kitchen_id, kitchenId];
    
    onFiltersChange({ ...filters, kitchen_id: newKitchens });
  };

  const handleMinhasTarefasChange = (checked: boolean) => {
    onFiltersChange({ ...filters, minhas_tarefas: checked });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      responsavel_id: [],
      kitchen_id: [],
      prazo_inicio: '',
      prazo_fim: '',
      minhas_tarefas: false,
    });
  };

  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.responsavel_id.length > 0 ||
    filters.kitchen_id.length > 0 ||
    filters.prazo_inicio ||
    filters.prazo_fim ||
    filters.minhas_tarefas;

  const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog', color: '#64748b' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#3b82f6' },
    { value: 'EM_REVISAO', label: 'Em Revisão', color: '#f59e0b' },
    { value: 'CONCLUIDA', label: 'Concluída', color: '#10b981' },
  ];

  const priorityOptions = [
    { value: 'BAIXA', label: 'Baixa', color: '#10b981' },
    { value: 'MEDIA', label: 'Média', color: '#f59e0b' },
    { value: 'ALTA', label: 'Alta', color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Filtro Minhas Tarefas - Destaque */}
      <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="minhas-tarefas"
            checked={filters.minhas_tarefas}
            onCheckedChange={handleMinhasTarefasChange}
            className="border-primary data-[state=checked]:bg-primary"
          />
          <Label 
            htmlFor="minhas-tarefas" 
            className="text-sm font-medium cursor-pointer flex items-center gap-2 text-text-primary"
          >
            <User className="h-4 w-4 text-primary" />
            <span>Mostrar apenas minhas tarefas</span>
          </Label>
        </div>
        {filters.minhas_tarefas && (
          <p className="text-xs text-primary mt-2 ml-6">
            Exibindo apenas tarefas onde você é o responsável
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Status */}
        <div className="space-y-3">
          <Label className="text-text-primary font-medium">Status</Label>
          <div className="space-y-2">
            {statusOptions.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filters.status.includes(status.value as TaskStatus)}
                  onCheckedChange={() => handleStatusChange(status.value as TaskStatus)}
                  className="border-glass-border data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor={`status-${status.value}`} 
                  className="text-sm cursor-pointer flex items-center gap-2 text-text-secondary"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  ></div>
                  {status.label}
                </Label>
              </div>
            ))}
          </div>
          
          {filters.status.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.status.map((status) => {
                const statusOption = statusOptions.find(s => s.value === status);
                return (
                  <span
                    key={status}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-white cursor-pointer hover:bg-primary/80"
                    onClick={() => handleStatusChange(status)}
                  >
                    {statusOption?.label}
                    <X className="ml-1 h-3 w-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Prioridade */}
        <div className="space-y-3">
          <Label className="text-text-primary font-medium">Prioridade</Label>
          <div className="space-y-2">
            {priorityOptions.map((priority) => (
              <div key={priority.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${priority.value}`}
                  checked={filters.priority.includes(priority.value as TaskPriority)}
                  onCheckedChange={() => handlePriorityChange(priority.value as TaskPriority)}
                  className="border-glass-border data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor={`priority-${priority.value}`} 
                  className="text-sm cursor-pointer flex items-center gap-2 text-text-secondary"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: priority.color }}
                  ></div>
                  {priority.label}
                </Label>
              </div>
            ))}
          </div>
          
          {filters.priority.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.priority.map((priority) => {
                const priorityOption = priorityOptions.find(p => p.value === priority);
                return (
                  <span
                    key={priority}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent text-white cursor-pointer hover:bg-accent/80"
                    onClick={() => handlePriorityChange(priority)}
                  >
                    {priorityOption?.label}
                    <X className="ml-1 h-3 w-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Unidades */}
        <div className="space-y-3">
          <Label className="text-text-primary font-medium">Unidades</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {kitchens.map((kitchen) => (
              <div key={kitchen.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`kitchen-${kitchen.id}`}
                  checked={filters.kitchen_id.includes(kitchen.id)}
                  onCheckedChange={() => handleKitchenChange(kitchen.id)}
                  className="border-glass-border data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor={`kitchen-${kitchen.id}`} 
                  className="text-sm cursor-pointer flex items-center gap-2 text-text-secondary"
                >
                  <Building className="h-3 w-3" />
                  {kitchen.nome}
                </Label>
              </div>
            ))}
          </div>
          
          {filters.kitchen_id.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.kitchen_id.map((kitchenId) => {
                const kitchen = kitchens.find(k => k.id === kitchenId);
                return (
                  <span
                    key={kitchenId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-white cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleKitchenChange(kitchenId)}
                  >
                    {kitchen?.nome || 'Unidade'}
                    <X className="ml-1 h-3 w-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Responsável */}
        <div className="space-y-3">
          <Label className="text-text-primary font-medium">Responsável</Label>
          <Select onValueChange={handleResponsavelChange}>
            <SelectTrigger className="filter-input">
              <SelectValue placeholder="Filtrar por responsável" />
            </SelectTrigger>
            <SelectContent className="bg-background-secondary border-glass-border">
              {users.map((user) => (
                <SelectItem 
                  key={user.id} 
                  value={user.id}
                  className="text-text-secondary hover:bg-glass-bg"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {user.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {filters.responsavel_id.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.responsavel_id.map((userId) => {
                const user = users.find(u => u.id === userId);
                return (
                  <span
                    key={userId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-light text-white cursor-pointer hover:bg-primary-light/80"
                    onClick={() => handleResponsavelChange(userId)}
                  >
                    {user?.nome || 'Usuário'}
                    <X className="ml-1 h-3 w-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Prazo */}
        <div className="space-y-3">
          <Label className="text-text-primary font-medium">Período do Prazo</Label>
          <div className="space-y-2">
            <Input
              type="date"
              placeholder="Data início"
              value={filters.prazo_inicio}
              onChange={(e) => onFiltersChange({ ...filters, prazo_inicio: e.target.value })}
              className="filter-input"
            />
            <Input
              type="date"
              placeholder="Data fim"
              value={filters.prazo_fim}
              onChange={(e) => onFiltersChange({ ...filters, prazo_fim: e.target.value })}
              className="filter-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}