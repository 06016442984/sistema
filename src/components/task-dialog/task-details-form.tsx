"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskPriority, TaskStatus, Kitchen, Project } from '@/types/database';
import { UserSelector } from './user-selector';

interface TaskDetailsFormProps {
  formData: {
    titulo: string;
    descricao: string;
    kitchen_id: string;
    project_id: string;
    prioridade: TaskPriority;
    status: TaskStatus;
    responsavel_id: string;
    prazo: string;
  };
  date: Date | undefined;
  availableKitchens: Kitchen[];
  availableProjects: Project[];
  availableUsers: any[];
  loadingUsers: boolean;
  onFormDataChange: (field: string, value: any) => void;
  onDateChange: (date: Date | undefined) => void;
  onKitchenChange: (kitchenId: string) => void;
  onProjectChange: (projectId: string) => void;
}

export function TaskDetailsForm({
  formData,
  date,
  availableKitchens,
  availableProjects,
  availableUsers,
  loadingUsers,
  onFormDataChange,
  onDateChange,
  onKitchenChange,
  onProjectChange
}: TaskDetailsFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Título */}
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => onFormDataChange('titulo', e.target.value)}
          placeholder="Digite o título da tarefa"
          required
        />
      </div>

      {/* Unidade */}
      <div className="space-y-2">
        <Label htmlFor="kitchen">Unidade</Label>
        <Select
          value={formData.kitchen_id}
          onValueChange={onKitchenChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma unidade" />
          </SelectTrigger>
          <SelectContent>
            {availableKitchens.map((kitchen) => (
              <SelectItem key={kitchen.id} value={kitchen.id}>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>{kitchen.nome} ({kitchen.codigo})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projeto */}
      <div className="space-y-2">
        <Label htmlFor="project">Projeto</Label>
        <Select
          value={formData.project_id}
          onValueChange={onProjectChange}
          disabled={!formData.kitchen_id}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !formData.kitchen_id 
                ? "Selecione uma unidade primeiro"
                : availableProjects.length === 0
                  ? "Nenhum projeto disponível"
                  : "Selecione um projeto"
            } />
          </SelectTrigger>
          <SelectContent>
            {availableProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Responsável */}
      <UserSelector
        value={formData.responsavel_id}
        availableUsers={availableUsers}
        loadingUsers={loadingUsers}
        projectSelected={!!formData.project_id}
        onChange={(value) => onFormDataChange('responsavel_id', value)}
      />

      {/* Prioridade */}
      <div className="space-y-2">
        <Label htmlFor="prioridade">Prioridade</Label>
        <Select
          value={formData.prioridade}
          onValueChange={(value: TaskPriority) => onFormDataChange('prioridade', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BAIXA">Baixa</SelectItem>
            <SelectItem value="MEDIA">Média</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: TaskStatus) => onFormDataChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BACKLOG">Backlog</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
            <SelectItem value="EM_REVISAO">Em Revisão</SelectItem>
            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prazo */}
      <div className="space-y-2">
        <Label>Prazo</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Descrição */}
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => onFormDataChange('descricao', e.target.value)}
          placeholder="Digite uma descrição para a tarefa (opcional)"
          rows={3}
        />
      </div>
    </div>
  );
}