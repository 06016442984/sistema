"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Validação do formulário atualizada para incluir a unidade
const projectSchema = z.object({
  name: z.string().min(3, { message: "O nome do projeto deve ter pelo menos 3 caracteres." }),
  client_name: z.string().min(2, { message: "O nome do cliente é obrigatório." }),
  description: z.string().optional(),
  status: z.string(),
  unit_id: z.string().uuid({ message: "Por favor, selecione uma unidade." }), // Adicionado campo de unidade
});

type ProjectFormData = z.infer<typeof projectSchema>;
type Unit = { id: string; name: string };

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function ProjectDialog({ isOpen, onClose, onProjectCreated }: ProjectDialogProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      client_name: '',
      description: '',
      status: 'To Do',
    }
  });

  // Efeito para buscar as unidades quando o formulário é aberto
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
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado.");

      const { error } = await supabase.from('projects').insert({
        ...data,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Projeto criado com sucesso!");
      onProjectCreated();
      handleClose();
    } catch (error: any) {
      toast.error("Falha ao criar o projeto.", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar um novo projeto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Campo de Seleção de Unidade */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit_id" className="text-right">
              Unidade
            </Label>
            <Controller
              name="unit_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" {...register("name")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_name" className="text-right">
              Cliente
            </Label>
            <Input id="client_name" {...register("client_name")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.client_name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.client_name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea id="description" {...register("description")} className="col-span-3 bg-slate-800 border-slate-700" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" className="btn-premium" disabled={isSubmitting}>
              {isSubmitting ? 'A criar...' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
