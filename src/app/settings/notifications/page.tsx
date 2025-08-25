"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, MessageSquare, CheckCircle, AlertCircle, Send, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { ProfileForm } from '@/components/profiles/profile-form';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const sendTestNotification = async () => {
    if (!userProfile?.telefone) {
      toast.error('Configure seu telefone primeiro');
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Mensagem de teste enviada com sucesso!');
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const hasWhatsAppConfigured = userProfile?.telefone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Configurações de Notificações
        </h1>
        <p className="text-text-secondary">
          Configure suas preferências de notificações WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Notificações */}
        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <MessageSquare className="h-5 w-5 text-primary" />
              Status WhatsApp
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Configuração atual das notificações
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-kanban-section-bg rounded-lg border border-kanban-card-border">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-text-primary">WhatsApp</p>
                  <p className="text-sm text-text-secondary">
                    {hasWhatsAppConfigured ? userProfile.telefone : 'Não configurado'}
                  </p>
                </div>
              </div>
              <Badge className={hasWhatsAppConfigured ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                {hasWhatsAppConfigured ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Ativo</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Inativo</>
                )}
              </Badge>
            </div>

            {/* Tipos de Notificação */}
            <div className="space-y-2">
              <h4 className="font-medium text-text-primary">Você receberá notificações para:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-text-primary">Tarefas atribuídas a você</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-text-primary">Mudanças de responsável</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-text-primary">Informações do projeto e prazo</span>
                </div>
              </div>
            </div>

            {/* Teste */}
            {hasWhatsAppConfigured && (
              <Button
                onClick={sendTestNotification}
                disabled={testLoading}
                variant="outline"
                className="w-full bg-kanban-section-bg border-kanban-card-border text-text-primary hover:bg-kanban-card-hover"
              >
                {testLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Enviando teste...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Mensagem de Teste
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Perfil */}
        <ProfileForm />
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-kanban-card-bg border-kanban-card-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-kanban-section-bg rounded-lg">
              <Smartphone className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium text-text-primary mb-1">1. Configure</h4>
              <p className="text-sm text-text-secondary">
                Adicione seu número WhatsApp no perfil
              </p>
            </div>
            
            <div className="text-center p-4 bg-kanban-section-bg rounded-lg">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium text-text-primary mb-1">2. Receba</h4>
              <p className="text-sm text-text-secondary">
                Notificações automáticas quando tarefas forem atribuídas
              </p>
            </div>
            
            <div className="text-center p-4 bg-kanban-section-bg rounded-lg">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium text-text-primary mb-1">3. Acompanhe</h4>
              <p className="text-sm text-text-secondary">
                Fique sempre atualizado sobre suas responsabilidades
              </p>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">📱 Exemplo de Mensagem</h4>
            <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border text-sm">
              <p className="text-text-primary">🎯 <strong>Nova Tarefa Atribuída</strong></p>
              <p className="text-text-primary">📋 <strong>Título:</strong> Implementar login</p>
              <p className="text-text-primary">🏢 <strong>Projeto:</strong> Sistema Web</p>
              <p className="text-text-primary">🔴 <strong>Prioridade:</strong> ALTA</p>
              <p className="text-text-primary">📅 <strong>Prazo:</strong> 15/01/2024</p>
              <p className="text-text-primary">👤 <strong>Atribuída por:</strong> João Silva</p>
              <p className="text-text-secondary">✅ Acesse o sistema para mais detalhes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}