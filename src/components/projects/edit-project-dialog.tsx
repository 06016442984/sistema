"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type Unit = { id: string; name: string };

const projectSchema = z.object({
  name: z.string().min(3, { message: "O nome do projeto deve ter pelo menos 3 caracteres." }),
  client_name: z.string().min(2, { message: "O nome do cliente é obrigatório." }),
  description: z.string().optional(),
  status: z.string(),
  unit_id: z.string().uuid({ message: "Por favor, selecione uma unidade." }),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  project: Project | null;
}

export function EditProjectDialog({ isOpen, onClose, onProjectUpdated, project }: EditProjectDialogProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  // Preenche o formulário com os dados do projeto quando ele é aberto
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        client_name: project.client_name || '',
        description: project.description || '',
        status: project.status,
        unit_id: project.unit_id || undefined,
      });
    }
  }, [project, reset]);

  // Busca as unidades disponíveis
  useEffect(() => {
    if (isOpen) {
      const fetchUnits = async () => {
        const { data, error } = await supabase.from('units').select('id, name');
        if (error) {
          toast.error("Falha ao carregar as unidades.");
        } else {
          setUnits(data);
        }
      };
      fetchUnits();
    }
  }, [isOpen, supabase]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', project.id);

      if (error) throw error;

      toast.success("Projeto atualizado com sucesso!");
      onProjectUpdated();
      onClose();
    } catch (error: any) {
      toast.error("Falha ao atualizar o projeto.", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>
            Modifique as informações do projeto abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Campos do formulário (iguais ao de criação) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit_id" className="text-right">Unidade</Label>
            <Controller
              name="unit_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="col-span-3 bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 text-white border-slate-700">
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unit_id && <p className="col-span-4 text-red-500 text-xs text-right">{errors.unit_id.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" {...register("name")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_name" className="text-right">Cliente</Label>
            <Input id="client_name" {...register("client_name")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.client_name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.client_name.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" {...register("description")} className="col-span-3 bg-slate-800 border-slate-700" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="col-span-3 bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white border-slate-700">
                            <SelectItem value="To Do">A Fazer</SelectItem>
                            <SelectItem value="In Progress">Em Andamento</SelectItem>
                            <SelectItem value="Done">Concluído</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="btn-premium" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
