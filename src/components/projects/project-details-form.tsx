"use client";

import { Button } from '@/components/ui/button';
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
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, Kitchen, ProjectStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { useProjectForm } from '@/hooks/use-project-form';
import { useFormValidation } from '@/hooks/use-form-validation';
import { projectFormSchema } from '@/lib/validations/project';
import { PROJECT_STATUS_LABELS } from '@/constants/project';

interface ProjectDetailsFormProps {
  project: Project | null;
  kitchens: Kitchen[];
  onSubmit: (data: ProjectFormData) => void;
  loading: boolean;
}

export interface ProjectFormData {
  nome: string;
  descricao: string;
  kitchen_id: string;
  status: ProjectStatus;
  inicio_previsto: string | null;
  fim_previsto: string | null;
}

export function ProjectDetailsForm({ project, kitchens, onSubmit, loading }: ProjectDetailsFormProps) {
  const { formState, updateField } = useProjectForm(project, kitchens);
  const { errors, validate, getFieldError } = useFormValidation(projectFormSchema);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: ProjectFormData = {
      nome: formState.nome,
      descricao: formState.descricao,
      kitchen_id: formState.kitchen_id,
      status: formState.status,
      inicio_previsto: formState.startDate ? format(formState.startDate, 'yyyy-MM-dd') : null,
      fim_previsto: formState.endDate ? format(formState.endDate, 'yyyy-MM-dd') : null,
    };

    if (validate(submitData)) {
      onSubmit(submitData);
    }
  };

  const renderFieldError = (field: string) => {
    const error = getFieldError(field);
    if (!error) return null;
    
    return (
      <div className="flex items-center gap-1 text-sm text-destructive mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="nome">Nome do Projeto</Label>
          <Input
            id="nome"
            value={formState.nome}
            onChange={(e) => updateField('nome', e.target.value)}
            placeholder="Digite o nome do projeto"
            className={cn(getFieldError('nome') && 'border-destructive')}
            required
          />
          {renderFieldError('nome')}
        </div>

        {/* Unidade */}
        <div className="space-y-2">
          <Label htmlFor="kitchen">Unidade</Label>
          <Select
            value={formState.kitchen_id}
            onValueChange={(value) => updateField('kitchen_id', value)}
          >
            <SelectTrigger className={cn(getFieldError('kitchen_id') && 'border-destructive')}>
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {kitchens.map((kitchen) => (
                <SelectItem key={kitchen.id} value={kitchen.id}>
                  {kitchen.nome} ({kitchen.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderFieldError('kitchen_id')}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formState.status}
            onValueChange={(value: ProjectStatus) => updateField('status', value)}
          >
            <SelectTrigger className={cn(getFieldError('status') && 'border-destructive')}>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderFieldError('status')}
        </div>

        {/* Data de Início */}
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formState.startDate && "text-muted-foreground",
                  getFieldError('inicio_previsto') && 'border-destructive'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formState.startDate ? format(formState.startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formState.startDate}
                onSelect={(date) => updateField('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {renderFieldError('inicio_previsto')}
        </div>

        {/* Data de Fim */}
        <div className="space-y-2">
          <Label>Data de Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formState.endDate && "text-muted-foreground",
                  getFieldError('fim_previsto') && 'border-destructive'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formState.endDate ? format(formState.endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formState.endDate}
                onSelect={(date) => updateField('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {renderFieldError('fim_previsto')}
        </div>

        {/* Descrição */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            value={formState.descricao}
            onChange={(e) => updateField('descricao', e.target.value)}
            placeholder="Digite uma descrição para o projeto (opcional)"
            className={cn(getFieldError('descricao') && 'border-destructive')}
            rows={3}
          />
          {renderFieldError('descricao')}
        </div>
      </div>
    </form>
  );
}