"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Save, 
  RefreshCw,
  Shield,
  ChefHat,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, profile, userRoles, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    nome: '',
    telefone: '',
    hora_inicio: '08:00',
    hora_fim: '17:00'
  });

  useEffect(() => {
    if (profile) {
      console.log('📋 Carregando dados do perfil:', profile);
      setProfileForm({
        nome: profile.nome || '',
        telefone: profile.telefone || '',
        hora_inicio: profile.hora_inicio || '08:00',
        hora_fim: profile.hora_fim || '17:00'
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log('💾 Iniciando salvamento do perfil...');
      console.log('👤 Usuário atual:', user?.id, user?.email);
      console.log('📋 Dados do formulário:', profileForm);

      // Validações
      if (!user?.id) {
        console.error('❌ Usuário não autenticado');
        toast.error('Usuário não autenticado');
        return;
      }

      if (!profileForm.nome.trim()) {
        console.error('❌ Nome é obrigatório');
        toast.error('Nome é obrigatório');
        return;
      }

      // Validar telefone se fornecido
      if (profileForm.telefone.trim()) {
        const phoneRegex = /^\+?55\d{10,11}$/;
        const cleanPhone = profileForm.telefone.replace(/\D/g, '');
        
        if (cleanPhone.length < 10 || cleanPhone.length > 13) {
          console.error('❌ Telefone inválido:', cleanPhone);
          toast.error('Telefone deve ter entre 10 e 13 dígitos');
          return;
        }
        console.log('✅ Telefone validado:', cleanPhone);
      }

      // Preparar dados para update
      const updateData = {
        nome: profileForm.nome.trim(),
        telefone: profileForm.telefone.trim() || null,
        hora_inicio: profileForm.hora_inicio,
        hora_fim: profileForm.hora_fim
      };

      console.log('📤 Dados para update:', updateData);
      console.log('🎯 Atualizando perfil ID:', user.id);

      // Executar update
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ Erro no update:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Update executado com sucesso:', data);
      toast.success('Perfil atualizado com sucesso!');
      
      if (profileForm.telefone.trim()) {
        toast.success('✅ WhatsApp configurado! Você receberá notificações de tarefas.');
      }

      // Atualizar dados no contexto
      if (refreshProfile) {
        await refreshProfile();
        console.log('✅ Perfil atualizado no contexto');
      }

    } catch (error: any) {
      console.error('💥 Erro ao salvar perfil:', error);
      console.error('💥 Tipo do erro:', typeof error);
      console.error('💥 Stack trace:', error?.stack);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao salvar perfil';
      if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      if (error?.code === 'PGRST301') {
        errorMessage = 'Erro de permissão. Verifique se você tem acesso para editar o perfil.';
      }
      if (error?.code === '42501') {
        errorMessage = 'Permissão negada. Entre em contato com o administrador.';
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAdmin = userRoles.some(role => role.role === 'ADMIN');

  // Filtrar apenas unidades ativas
  const activeUserRoles = userRoles.filter(role => role.kitchens?.ativo === true);

  // Loading state
  if (!user) {
    return (
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Meu Perfil</h1>
          <p className="text-text-secondary">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Meu Perfil</h1>
          <p className="text-text-secondary">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={refreshProfile}
          disabled={loading}
          className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Atualize suas informações básicas
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 filter-input opacity-60"
                  />
                </div>
                <p className="text-xs text-text-secondary">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-text-primary">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="nome"
                    value={profileForm.nome}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="pl-10 filter-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-text-primary">Telefone (WhatsApp)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="telefone"
                    value={profileForm.telefone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="+55 11 99999-9999"
                    className="pl-10 filter-input"
                  />
                </div>
                <p className="text-xs text-text-secondary">
                  Usado para notificações de tarefas via WhatsApp
                </p>
              </div>
            </CardContent>
          </div>

          {/* Horário de Trabalho */}
          <div className="glass-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Clock className="h-5 w-5 text-secondary" />
                Horário de Trabalho
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Configure seu horário para receber lembretes de tarefas
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio" className="text-text-primary">Início da Jornada</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={profileForm.hora_inicio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="filter-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_fim" className="text-text-primary">Fim da Jornada</Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={profileForm.hora_fim}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, hora_fim: e.target.value }))}
                    className="filter-input"
                  />
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">Como funciona</h4>
                <p className="text-sm text-text-secondary">
                  O sistema usa estes horários para enviar lembretes de tarefas nos momentos ideais:
                  início da jornada, meio do período e fim do expediente, baseado na prioridade da tarefa.
                </p>
              </div>
            </CardContent>
          </div>

          {/* Botão Salvar */}
          <Button
            onClick={handleSaveProfile}
            disabled={saving || !profileForm.nome.trim()}
            className="w-full bg-primary hover:bg-primary/80"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {/* Sidebar com informações */}
        <div className="space-y-6">
          {/* Status da Conta */}
          <div className="glass-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Shield className="h-5 w-5 text-accent" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            
            <CardContent className="px-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Tipo de Conta</span>
                <Badge 
                  variant={isAdmin ? "default" : "secondary"}
                  className={isAdmin ? 'bg-accent text-white' : 'bg-glass-bg text-text-secondary'}
                >
                  {isAdmin ? 'Administrador' : 'Usuário'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Unidades</span>
                <Badge variant="outline" className="border-glass-border text-text-secondary">
                  {activeUserRoles.length}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Conta Criada</span>
                <span className="text-sm text-text-secondary">
                  {profile?.criado_em ? formatDate(profile.criado_em) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </div>

          {/* Suas Unidades */}
          <div className="glass-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <ChefHat className="h-5 w-5 text-primary" />
                Suas Unidades
              </CardTitle>
            </CardHeader>
            
            <CardContent className="px-0 space-y-3">
              {activeUserRoles.length === 0 ? (
                <p className="text-text-secondary text-sm">
                  Nenhuma unidade ativa atribuída
                </p>
              ) : (
                activeUserRoles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded-lg bg-glass-bg border border-glass-border">
                    <div>
                      <div className="font-medium text-text-primary text-sm">
                        {role.kitchens?.nome}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {role.kitchens?.codigo}
                      </div>
                    </div>
                    <Badge 
                      variant={role.role === 'ADMIN' ? 'default' : 'secondary'}
                      className={`text-xs ${role.role === 'ADMIN' ? 'bg-primary text-white' : 'bg-glass-bg text-text-secondary'}`}
                    >
                      {role.role}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </div>

          {/* Informações do Sistema */}
          <div className="glass-card p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Calendar className="h-5 w-5 text-secondary" />
                Informações
              </CardTitle>
            </CardHeader>
            
            <CardContent className="px-0 space-y-3">
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Último Login</span>
                  <span className="text-text-primary">
                    {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Perfil Atualizado</span>
                  <span className="text-text-primary">
                    {profile?.atualizado_em ? formatDate(profile.atualizado_em) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}