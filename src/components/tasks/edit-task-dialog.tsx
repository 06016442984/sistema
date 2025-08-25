"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

const taskSchema = z.object({
  title: z.string().min(3, { message: "O título é obrigatório." }),
  description: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  task: Task | null;
}

export function EditTaskDialog({ isOpen, onClose, onTaskUpdated, task }: EditTaskDialogProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  // Preenche o formulário com os dados da tarefa quando a janela é aberta
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description,
        })
        .eq('id', task.id);

      if (error) throw error;

      toast.success("Tarefa atualizada com sucesso!");
      onTaskUpdated();
      onClose();
    } catch (error: any) {
      toast.error("Falha ao atualizar a tarefa.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>
            Modifique as informações da tarefa abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input id="title" {...register("title")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.title && <p className="col-span-4 text-red-500 text-xs text-right">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" {...register("description")} className="col-span-3 bg-slate-800 border-slate-700" />
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
