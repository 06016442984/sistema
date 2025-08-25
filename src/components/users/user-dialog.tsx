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
import { Switch } from '@/components/ui/switch';
import { Smartphone, User, Mail, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { toast } from 'sonner';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onSaved: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSaved }: UserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    hora_inicio: '08:00',
    hora_fim: '17:00',
    ativo: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        hora_inicio: user.hora_inicio || '08:00',
        hora_fim: user.hora_fim || '17:00',
        ativo: user.ativo,
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        hora_inicio: '08:00',
        hora_fim: '17:00',
        ativo: true,
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar telefone (obrigatório)
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'WhatsApp é obrigatório';
    } else {
      // Remover caracteres não numéricos para validação
      const phoneNumbers = formData.telefone.replace(/\D/g, '');
      
      // Validar formato brasileiro (11 dígitos com DDD)
      if (phoneNumbers.length < 10 || phoneNumbers.length > 13) {
        newErrors.telefone = 'Formato inválido. Use: (11) 99999-9999';
      }
    }

    // Validar horários
    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'Horário de início é obrigatório';
    }

    if (!formData.hora_fim) {
      newErrors.hora_fim = 'Horário de fim é obrigatório';
    }

    // Validar se horário de fim é depois do início
    if (formData.hora_inicio && formData.hora_fim) {
      const inicio = new Date(`2000-01-01T${formData.hora_inicio}:00`);
      const fim = new Date(`2000-01-01T${formData.hora_fim}:00`);
      
      if (fim <= inicio) {
        newErrors.hora_fim = 'Horário de fim deve ser depois do início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara brasileira
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      // Para números com código do país
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, telefone: formatted }));
    
    // Limpar erro do telefone se começar a digitar
    if (errors.telefone) {
      setErrors(prev => ({ ...prev, telefone: '' }));
    }
  };

  const calculateWorkHours = () => {
    if (formData.hora_inicio && formData.hora_fim) {
      const inicio = new Date(`2000-01-01T${formData.hora_inicio}:00`);
      const fim = new Date(`2000-01-01T${formData.hora_fim}:00`);
      const diffMs = fim.getTime() - inicio.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours > 0) {
        return `${diffHours}h de trabalho`;
      }
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      if (user) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: formData.nome.trim(),
            telefone: formData.telefone.trim(),
            hora_inicio: formData.hora_inicio,
            hora_fim: formData.hora_fim,
            ativo: formData.ativo,
          })
          .eq('id', user.id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário - primeiro verificar se o email já existe
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email.trim())
          .single();

        if (existingUser) {
          toast.error('Já existe um usuário com este email');
          setLoading(false);
          return;
        }

        // Verificar se o telefone já existe
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id, nome')
          .eq('telefone', formData.telefone.trim())
          .single();

        if (existingPhone) {
          toast.error(`Este WhatsApp já está cadastrado para: ${existingPhone.nome}`);
          setLoading(false);
          return;
        }

        // Criar perfil diretamente (simulando criação de usuário)
        const { error } = await supabase
          .from('profiles')
          .insert([{
            nome: formData.nome.trim(),
            email: formData.email.trim(),
            telefone: formData.telefone.trim(),
            hora_inicio: formData.hora_inicio,
            hora_fim: formData.hora_fim,
            ativo: formData.ativo,
          }]);

        if (error) throw error;
        toast.success('Usuário criado com sucesso!');
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(`Erro ao salvar usuário: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Atualize as informações do usuário.'
              : 'Adicione um novo usuário ao sistema. WhatsApp e horários são obrigatórios para notificações.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, nome: e.target.value }));
                  if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
                }}
                placeholder="Digite o nome completo"
                className={errors.nome ? 'border-red-500' : ''}
                required
              />
              {errors.nome && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nome}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="Digite o email"
                disabled={!!user} // Não permitir alterar email de usuário existente
                className={errors.email ? 'border-red-500' : ''}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
              {user && (
                <p className="text-sm text-muted-foreground">
                  O email não pode ser alterado após a criação
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                WhatsApp *
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className={errors.telefone ? 'border-red-500' : ''}
                required
              />
              {errors.telefone && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.telefone}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Número obrigatório para receber notificações de tarefas
              </p>
            </div>

            {/* Horário de Início */}
            <div className="space-y-2">
              <Label htmlFor="hora_inicio" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Início da Jornada *
              </Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, hora_inicio: e.target.value }));
                  if (errors.hora_inicio) setErrors(prev => ({ ...prev, hora_inicio: '' }));
                }}
                className={errors.hora_inicio ? 'border-red-500' : ''}
                required
              />
              {errors.hora_inicio && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.hora_inicio}
                </p>
              )}
            </div>

            {/* Horário de Fim */}
            <div className="space-y-2">
              <Label htmlFor="hora_fim" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fim da Jornada *
              </Label>
              <Input
                id="hora_fim"
                type="time"
                value={formData.hora_fim}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, hora_fim: e.target.value }));
                  if (errors.hora_fim) setErrors(prev => ({ ...prev, hora_fim: '' }));
                }}
                className={errors.hora_fim ? 'border-red-500' : ''}
                required
              />
              {errors.hora_fim && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.hora_fim}
                </p>
              )}
              {calculateWorkHours() && (
                <p className="text-sm text-muted-foreground">
                  {calculateWorkHours()}
                </p>
              )}
            </div>

            {/* Status Ativo */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Usuário ativo</Label>
            </div>
          </div>

          {/* Info sobre Lembretes */}
          <div className="p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sistema de Lembretes Inteligente
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• <strong>Alta prioridade:</strong> 4 lembretes (delegação + início + meio + fim da jornada)</p>
              <p>• <strong>Média prioridade:</strong> 3 lembretes (delegação + início + meio da jornada)</p>
              <p>• <strong>Baixa prioridade:</strong> 1 lembrete (início da jornada)</p>
              <p className="mt-2 text-xs">Os horários configurados são usados para calcular os lembretes automáticos.</p>
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
              {loading ? 'Salvando...' : (user ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}