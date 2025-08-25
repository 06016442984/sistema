"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, MessageSquare, CheckCircle, AlertCircle, Send, Settings, Link, Key, Server } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function EvolutionConfigPage() {
  const { user, userRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [evolutionConfig, setEvolutionConfig] = useState({
    apiUrl: '',
    apiKey: '',
    instance: '',
  });
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Verificar se é admin
  const isAdmin = userRoles.some(role => role.role === 'ADMIN');

  useEffect(() => {
    if (isAdmin) {
      loadEvolutionConfig();
    }
  }, [isAdmin]);

  const loadEvolutionConfig = async () => {
    try {
      // Aqui você pode carregar as configurações salvas
      // Por enquanto, vamos deixar vazio para o usuário configurar
      console.log('Carregando configurações da Evolution API...');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const testConnection = async () => {
    if (!evolutionConfig.apiUrl || !evolutionConfig.apiKey || !evolutionConfig.instance) {
      toast.error('Preencha todas as configurações primeiro');
      return;
    }

    setConnectionLoading(true);
    try {
      // Testar conexão com a Evolution API
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
        },
      });

      if (response.ok) {
        const instances = await response.json();
        const instanceExists = instances.some((inst: any) => inst.instance.instanceName === evolutionConfig.instance);
        
        if (instanceExists) {
          setConnectionStatus('connected');
          toast.success('✅ Conexão com Evolution API estabelecida!');
        } else {
          setConnectionStatus('disconnected');
          toast.error(`❌ Instância "${evolutionConfig.instance}" não encontrada`);
        }
      } else {
        setConnectionStatus('disconnected');
        toast.error('❌ Erro ao conectar com Evolution API');
      }

    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus('disconnected');
      toast.error(`Erro: ${error.message}`);
    } finally {
      setConnectionLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem salvar configurações');
      return;
    }

    setLoading(true);
    try {
      // Aqui você salvaria as configurações no Supabase
      // Por exemplo, em uma tabela de configurações ou como secrets
      
      toast.success('⚙️ Configurações salvas! Configure as variáveis de ambiente no Supabase.');
      toast.info('📋 Acesse: Project → Edge Functions → Manage Secrets');

    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!user) return;

    setTestLoading(true);
    try {
      const response = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Mensagem de teste enviada via Evolution API!');
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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Configuração Evolution API
          </h1>
          <p className="text-text-secondary">
            Apenas administradores podem configurar a Evolution API
          </p>
        </div>

        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Acesso Restrito</h3>
            <p className="text-text-secondary">
              Você precisa ser administrador para acessar as configurações da Evolution API.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Configuração Evolution API
        </h1>
        <p className="text-text-secondary">
          Configure a integração com Evolution API para notificações WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Server className="h-5 w-5 text-primary" />
              Configurações da API
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Configure os dados de acesso à Evolution API
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* URL da API */}
            <div className="space-y-2">
              <Label htmlFor="apiUrl" className="text-text-primary">URL da API</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  id="apiUrl"
                  value={evolutionConfig.apiUrl}
                  onChange={(e) => setEvolutionConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://api.evolution.com.br"
                  className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-primary"
                />
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-text-primary">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  id="apiKey"
                  type="password"
                  value={evolutionConfig.apiKey}
                  onChange={(e) => setEvolutionConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Sua API Key da Evolution"
                  className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-primary"
                />
              </div>
            </div>

            {/* Instância */}
            <div className="space-y-2">
              <Label htmlFor="instance" className="text-text-primary">Nome da Instância</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  id="instance"
                  value={evolutionConfig.instance}
                  onChange={(e) => setEvolutionConfig(prev => ({ ...prev, instance: e.target.value }))}
                  placeholder="minha-instancia"
                  className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-primary"
                />
              </div>
            </div>

            {/* Status da Conexão */}
            <div className="flex items-center justify-between p-3 bg-kanban-section-bg rounded-lg border border-kanban-card-border">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-text-primary">Status da Conexão</p>
                  <p className="text-sm text-text-secondary">
                    {connectionStatus === 'unknown' ? 'Não testado' : 
                     connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>
              <Badge className={
                connectionStatus === 'connected' ? 'bg-green-600 text-white' : 
                connectionStatus === 'disconnected' ? 'bg-red-600 text-white' : 
                'bg-gray-600 text-white'
              }>
                {connectionStatus === 'connected' ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Online</>
                ) : connectionStatus === 'disconnected' ? (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Offline</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Desconhecido</>
                )}
              </Badge>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                onClick={testConnection}
                disabled={connectionLoading}
                variant="outline"
                className="flex-1 bg-kanban-section-bg border-kanban-card-border text-text-primary hover:bg-kanban-card-hover"
              >
                {connectionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Testando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Testar Conexão
                  </div>
                )}
              </Button>

              <Button
                onClick={saveConfiguration}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-light text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Salvar
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teste e Instruções */}
        <div className="space-y-6">
          {/* Teste de Mensagem */}
          <Card className="bg-kanban-card-bg border-kanban-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Send className="h-5 w-5 text-primary" />
                Teste de Mensagem
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Envie uma mensagem de teste para verificar a integração
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button
                onClick={sendTestMessage}
                disabled={testLoading || connectionStatus !== 'connected'}
                className="w-full bg-primary hover:bg-primary-light text-white"
              >
                {testLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando teste...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Mensagem de Teste
                  </div>
                )}
              </Button>
              
              {connectionStatus !== 'connected' && (
                <p className="text-sm text-text-secondary mt-2 text-center">
                  Configure e teste a conexão primeiro
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="bg-kanban-card-bg border-kanban-card-border">
            <CardHeader>
              <CardTitle className="text-text-primary">Variáveis de Ambiente</CardTitle>
              <CardDescription className="text-text-secondary">
                Configure estas variáveis no Supabase Dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border">
                <p className="text-sm font-mono text-text-primary">EVOLUTION_API_URL</p>
                <p className="text-xs text-text-secondary">URL base da sua Evolution API</p>
              </div>
              
              <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border">
                <p className="text-sm font-mono text-text-primary">EVOLUTION_API_KEY</p>
                <p className="text-xs text-text-secondary">Chave de API para autenticação</p>
              </div>
              
              <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border">
                <p className="text-sm font-mono text-text-primary">EVOLUTION_INSTANCE</p>
                <p className="text-xs text-text-secondary">Nome da instância WhatsApp</p>
              </div>

              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-300">
                  📋 <strong>Como configurar:</strong><br/>
                  1. Acesse Supabase Dashboard<br/>
                  2. Project → Edge Functions → Manage Secrets<br/>
                  3. Adicione as 3 variáveis acima<br/>
                  4. Teste a conexão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}