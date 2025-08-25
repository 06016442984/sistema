"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Kitchen, UserRole } from '@/types/database';
import { toast } from 'sonner';

const addMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'SUPERVISORA', 'NUTRICIONISTA', 'AUX_ADM']),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitchen: Kitchen;
  onMemberAdded: () => void;
}

export function AddMemberDialog({ open, onOpenChange, kitchen, onMemberAdded }: AddMemberDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: '',
      role: 'AUX_ADM',
    },
  });

  const onSubmit = async (data: AddMemberFormData) => {
    try {
      setLoading(true);

      // Primeiro, verificar se o usuário existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();

      if (profileError || !profile) {
        toast.error('Usuário não encontrado com este email');
        return;
      }

      // Verificar se o usuário já é membro desta cozinha
      const { data: existingMember, error: memberError } = await supabase
        .from('user_kitchen_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('kitchen_id', kitchen.id)
        .single();

      if (existingMember) {
        toast.error('Usuário já é membro desta cozinha');
        return;
      }

      // Adicionar o usuário à cozinha
      const { error: insertError } = await supabase
        .from('user_kitchen_roles')
        .insert([{
          user_id: profile.id,
          kitchen_id: kitchen.id,
          role: data.role,
        }]);

      if (insertError) throw insertError;

      toast.success('Membro adicionado com sucesso!');
      onMemberAdded();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Erro ao adicionar membro:', error);
      toast.error('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'SUPERVISORA', label: 'Supervisora' },
    { value: 'NUTRICIONISTA', label: 'Nutricionista' },
    { value: 'AUX_ADM', label: 'Auxiliar Administrativo' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Adicione um novo membro à cozinha {kitchen.nome}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Usuário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="usuario@exemplo.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}