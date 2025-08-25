"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, Mail, Save, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export function ProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Validar formato do telefone
      if (formData.telefone) {
        const phoneRegex = /^\+?55\d{10,11}$/;
        const cleanPhone = formData.telefone.replace(/\D/g, '');
        
        if (cleanPhone.length < 10 || cleanPhone.length > 13) {
          throw new Error('Telefone deve ter entre 10 e 13 dígitos');
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          telefone: formData.telefone || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      
      if (formData.telefone) {
        toast.success('✅ WhatsApp configurado! Você receberá notificações de tarefas.');
      }

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara brasileira
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, telefone: formatted }));
  };

  return (
    <Card className="bg-kanban-card-bg border-kanban-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-text-primary">
          <User className="h-5 w-5 text-primary" />
          Meu Perfil
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Atualize suas informações pessoais e configure notificações WhatsApp
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-text-primary">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Seu nome completo"
                className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-primary"
                required
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                id="email"
                value={formData.email}
                readOnly
                className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-secondary cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-text-secondary">
              O email não pode ser alterado
            </p>
          </div>

          {/* Telefone WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-text-primary">
              Telefone WhatsApp (Opcional)
            </Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="+55 (11) 99999-9999"
                className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-primary"
              />
            </div>
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium">Notificações WhatsApp</p>
                  <p className="text-blue-200 text-xs mt-1">
                    Configure seu WhatsApp para receber notificações automáticas quando tarefas forem atribuídas a você.
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    <strong>Formato:</strong> +55 (DDD) 9XXXX-XXXX
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-white"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}