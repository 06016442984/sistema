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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { Kitchen } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

interface KitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitchen: Kitchen | null;
  onSaved: () => void;
}

export function KitchenDialog({ open, onOpenChange, kitchen, onSaved }: KitchenDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    endereco: '',
    ativo: true,
  });

  useEffect(() => {
    if (kitchen) {
      setFormData({
        nome: kitchen.nome,
        codigo: kitchen.codigo,
        endereco: kitchen.endereco || '',
        ativo: kitchen.ativo,
      });
    } else {
      setFormData({
        nome: '',
        codigo: '',
        endereco: '',
        ativo: true,
      });
    }
  }, [kitchen]);

  const generateCode = () => {
    const code = formData.nome
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    setFormData(prev => ({ ...prev, codigo: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Verificar se o código já existe (apenas para novas cozinhas ou se o código foi alterado)
      if (!kitchen || kitchen.codigo !== formData.codigo) {
        const { data: existingKitchen } = await supabase
          .from('kitchens')
          .select('id')
          .eq('codigo', formData.codigo)
          .single();

        if (existingKitchen) {
          toast.error('Já existe uma cozinha com este código');
          setLoading(false);
          return;
        }
      }

      const kitchenData = {
        nome: formData.nome,
        codigo: formData.codigo,
        endereco: formData.endereco || null,
        ativo: formData.ativo,
        criado_por: user.id,
      };

      if (kitchen) {
        // Atualizar cozinha existente
        const { error } = await supabase
          .from('kitchens')
          .update(kitchenData)
          .eq('id', kitchen.id);

        if (error) throw error;
        toast.success('Cozinha atualizada com sucesso!');
      } else {
        // Criar nova cozinha
        const { data: newKitchen, error } = await supabase
          .from('kitchens')
          .insert([kitchenData])
          .select()
          .single();

        if (error) throw error;

        // Adicionar o usuário atual como admin da nova cozinha
        const { error: roleError } = await supabase
          .from('user_kitchen_roles')
          .insert([{
            user_id: user.id,
            kitchen_id: newKitchen.id,
            role: 'ADMIN'
          }]);

        if (roleError) throw roleError;

        toast.success('Cozinha criada com sucesso!');
      }

      onSaved();
    } catch (error) {
      console.error('Erro ao salvar cozinha:', error);
      toast.error('Erro ao salvar cozinha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {kitchen ? 'Editar Cozinha' : 'Nova Cozinha'}
          </DialogTitle>
          <DialogDescription>
            {kitchen 
              ? 'Atualize as informações da cozinha.'
              : 'Crie uma nova cozinha para organizar seus projetos.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Cozinha</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome da cozinha"
              required
            />
          </div>

          {/* Código */}
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <div className="flex gap-2">
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                placeholder="CÓDIGO"
                maxLength={10}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateCode}
                disabled={!formData.nome}
              >
                Gerar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Código único para identificar a cozinha
            </p>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Digite o endereço da cozinha (opcional)"
              rows={2}
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Cozinha ativa</Label>
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
              {loading ? 'Salvando...' : (kitchen ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}