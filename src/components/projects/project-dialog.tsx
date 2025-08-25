"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { Project, Kitchen, ProjectStatus } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  kitchens: Kitchen[];
  onSaved: () => void;
}

export function ProjectDialog({ open, onOpenChange, project, kitchens, onSaved }: ProjectDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    kitchen_id: '',
    status: 'ATIVO' as ProjectStatus,
    inicio_previsto: '',
    fim_previsto: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        nome: project.nome,
        descricao: project.descricao || '',
        kitchen_id: project.kitchen_id,
        status: project.status,
        inicio_previsto: project.inicio_previsto || '',
        fim_previsto: project.fim_previsto || '',
      });
      
      if (project.inicio_previsto) {
        setStartDate(new Date(project.inicio_previsto));
      }
      if (project.fim_previsto) {
        setEndDate(new Date(project.fim_previsto));
      }
    } else {
      setFormData({
        nome: '',
        descricao: '',
        kitchen_id: kitchens.length > 0 ? kitchens[0].id : '',
        status: 'ATIVO',
        inicio_previsto: '',
        fim_previsto: '',
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [project, kitchens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const projectData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        kitchen_id: formData.kitchen_id,
        status: formData.status,
        inicio_previsto: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        fim_previsto: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        criado_por: user.id,
      };

      if (project) {
        // Atualizar projeto existente
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);

        if (error) throw error;
        toast.success('Projeto atualizado com sucesso!');
      } else {
        // Criar novo projeto
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        toast.success('Projeto criado com sucesso!');
      }

      onSaved();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast.error('Erro ao salvar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Atualize as informações do projeto.'
              : 'Crie um novo projeto para organizar suas tarefas.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nome">Nome do Projeto</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Digite o nome do projeto"
                required
              />
            </div>

            {/* Cozinha */}
            <div className="space-y-2">
              <Label htmlFor="kitchen">Cozinha</Label>
              <Select
                value={formData.kitchen_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, kitchen_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cozinha" />
                </SelectTrigger>
                <SelectContent>
                  {kitchens.map((kitchen) => (
                    <SelectItem key={kitchen.id} value={kitchen.id}>
                      {kitchen.nome} ({kitchen.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ProjectStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="PAUSADO">Pausado</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
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
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
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
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Digite uma descrição para o projeto (opcional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (project ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}