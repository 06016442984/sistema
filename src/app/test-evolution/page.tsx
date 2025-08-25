"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  TestTube,
  Wifi,
  WifiOff,
  List,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function TestEvolutionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('pedro2');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('🧪 Teste de conexão Evolution API\n\nSe você recebeu esta mensagem, a integração está funcionando perfeitamente! ✅');

  // Configurações da Evolution API
  const evolutionConfig = {
    apiUrl: 'https://n88n-evolution-api.tijjpa.easypanel.host',
    apiKey: '05F9D81C8C09-441A-B724-1558572D1281',
    instance: selectedInstance
  };

  const listInstances = async () => {
    setInstancesLoading(true);
    try {
      console.log('🔍 Listando instâncias disponíveis...');
      
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
        },
      });

      console.log('📡 Status da resposta:', response.status);

      if (response.ok) {
        const instances = await response.json();
        console.log('📋 Instâncias encontradas:', instances);
        
        setAvailableInstances(instances);
        
        if (instances.length === 0) {
          toast.warning('⚠️ Nenhuma instância encontrada');
        } else {
          toast.success(`✅ ${instances.length} instância(s) encontrada(s)`);
          
          // Verificar se pedro2 existe
          const pedro2Exists = instances.some((inst: any) => 
            inst.instance?.instanceName === 'pedro2' ||
            inst.instanceName === 'pedro2'
          );
          
          if (!pedro2Exists) {
            toast.warning('⚠️ Instância "pedro2" não encontrada');
            // Sugerir primeira instância disponível
            if (instances.length > 0) {
              const firstInstance = instances[0].instance?.instanceName || instances[0].instanceName;
              if (firstInstance) {
                setSelectedInstance(firstInstance);
                toast.info(`💡 Sugerindo usar: "${firstInstance}"`);
              }
            }
          } else {
            toast.success('✅ Instância "pedro2" encontrada!');
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        toast.error(`❌ Erro ao listar instâncias: ${response.status}`);
      }

    } catch (error: any) {
      console.error('💥 Erro ao listar instâncias:', error);
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setInstancesLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionLoading(true);
    try {
      console.log('🔄 Testando conexão com Evolution API...');
      
      // Primeiro listar instâncias
      await listInstances();
      
      // Testar endpoint específico da instância
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/connect/${selectedInstance}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
        },
      });

      console.log('📡 Status da conexão da instância:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Status da instância:', result);
        
        setConnectionStatus('connected');
        toast.success(`✅ Instância "${selectedInstance}" conectada!`);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na instância:', errorText);
        setConnectionStatus('disconnected');
        toast.error(`❌ Instância "${selectedInstance}" não conectada`);
      }

    } catch (error: any) {
      console.error('💥 Erro ao testar conexão:', error);
      setConnectionStatus('disconnected');
      toast.error(`❌ Erro de conexão: ${error.message}`);
    } finally {
      setConnectionLoading(false);
    }
  };

  const createInstance = async () => {
    try {
      console.log('🔄 Criando instância pedro2...');
      
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
        },
        body: JSON.stringify({
          instanceName: 'pedro2',
          token: evolutionConfig.apiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      const result = await response.json();
      console.log('📥 Resultado criação:', result);

      if (response.ok) {
        toast.success('✅ Instância "pedro2" criada com sucesso!');
        setSelectedInstance('pedro2');
        await listInstances();
      } else {
        toast.error(`❌ Erro ao criar instância: ${result.message || 'Erro desconhecido'}`);
      }

    } catch (error: any) {
      console.error('💥 Erro ao criar instância:', error);
      toast.error(`❌ Erro: ${error.message}`);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite um número de telefone para teste');
      return;
    }

    setTestLoading(true);
    try {
      // Formatar número
      let phone = testPhone.replace(/\D/g, '');
      if (!phone.startsWith('55') && phone.length === 11) {
        phone = '55' + phone;
      }

      console.log('📱 Enviando mensagem de teste para:', phone);

      const response = await fetch(`${evolutionConfig.apiUrl}/message/sendText/${selectedInstance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: testMessage
        })
      });

      const result = await response.json();
      console.log('📥 Resultado:', result);

      if (response.ok && result.key?.id) {
        toast.success('✅ Mensagem de teste enviada com sucesso!');
        toast.success(`📨 ID da mensagem: ${result.key.id}`);
      } else {
        toast.error(`❌ Erro: ${result.message || 'Falha ao enviar mensagem'}`);
      }

    } catch (error: any) {
      console.error('💥 Erro ao enviar mensagem:', error);
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const sendUserTestNotification = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setLoading(true);
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
        toast.success('✅ Notificação de tarefa enviada com sucesso!');
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <TestTube className="h-8 w-8 text-primary" />
          Diagnóstico Evolution API
        </h1>
        <p className="text-text-secondary">
          Diagnosticar e configurar a integração com a Evolution API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instâncias Disponíveis */}
        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <List className="h-5 w-5 text-primary" />
              Instâncias Disponíveis
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Listar e gerenciar instâncias da Evolution API
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={listInstances}
                disabled={instancesLoading}
                variant="outline"
                className="flex-1"
              >
                {instancesLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Listando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Listar Instâncias
                  </div>
                )}
              </Button>
              
              <Button
                onClick={createInstance}
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar pedro2
              </Button>
            </div>

            {/* Lista de Instâncias */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableInstances.length === 0 ? (
                <div className="text-center py-4 text-text-secondary">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Nenhuma instância encontrada</p>
                  <p className="text-xs">Clique em "Listar Instâncias" para verificar</p>
                </div>
              ) : (
                availableInstances.map((instance, index) => {
                  const instanceName = instance.instance?.instanceName || instance.instanceName || `Instância ${index + 1}`;
                  const isSelected = instanceName === selectedInstance;
                  const status = instance.instance?.state || instance.state || 'unknown';
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-kanban-card-border bg-kanban-section-bg hover:bg-kanban-section-bg/80'
                      }`}
                      onClick={() => setSelectedInstance(instanceName)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{instanceName}</p>
                          <p className="text-xs text-text-secondary">Status: {status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Badge className="bg-primary text-white">Selecionada</Badge>
                          )}
                          <Badge className={
                            status === 'open' ? 'bg-green-600 text-white' :
                            status === 'close' ? 'bg-red-600 text-white' :
                            'bg-gray-600 text-white'
                          }>
                            {status === 'open' ? 'Online' : 
                             status === 'close' ? 'Offline' : 'Desconhecido'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Instância Selecionada */}
            <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border">
              <p className="text-sm font-medium text-text-primary">Instância Selecionada</p>
              <p className="text-xs text-text-secondary font-mono">{selectedInstance}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status da Conexão */}
        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Wifi className="h-5 w-5 text-primary" />
              Status da Conexão
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Testar conectividade com a instância selecionada
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Configurações */}
            <div className="space-y-3">
              <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border">
                <p className="text-sm font-medium text-text-primary">URL da API</p>
                <p className="text-xs text-text-secondary font-mono">{evolutionConfig.apiUrl}</p>
              </div>
              
              <div className="bg-kanban-section-bg p-3 rounded border border-kanban-card-border">
                <p className="text-sm font-medium text-text-primary">Instância</p>
                <p className="text-xs text-text-secondary font-mono">{selectedInstance}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-kanban-section-bg rounded-lg border border-kanban-card-border">
              <div className="flex items-center gap-3">
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : connectionStatus === 'disconnected' ? (
                  <WifiOff className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <p className="font-medium text-text-primary">Conexão</p>
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

            <Button
              onClick={testConnection}
              disabled={connectionLoading}
              className="w-full bg-primary hover:bg-primary-light text-white"
            >
              {connectionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Testando Conexão...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Testar Conexão
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Teste de Mensagem */}
        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <MessageSquare className="h-5 w-5 text-primary" />
              Teste de Mensagem
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Enviar mensagem de teste para um número específico
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone" className="text-text-primary">Número de Teste</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  id="testPhone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="pl-10 bg-kanban-section-bg border-kanban-card-border text-text-primary"
                />
              </div>
              <p className="text-xs text-text-secondary">
                Digite o número com DDD (será formatado automaticamente)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage" className="text-text-primary">Mensagem de Teste</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="bg-kanban-section-bg border-kanban-card-border text-text-primary"
              />
            </div>

            <Button
              onClick={sendTestMessage}
              disabled={testLoading || connectionStatus !== 'connected'}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {testLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Enviar Mensagem de Teste
                </div>
              )}
            </Button>

            {connectionStatus !== 'connected' && (
              <p className="text-sm text-text-secondary text-center">
                Teste a conexão primeiro
              </p>
            )}
          </CardContent>
        </Card>

        {/* Teste de Notificação de Tarefa */}
        <Card className="bg-kanban-card-bg border-kanban-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <TestTube className="h-5 w-5 text-primary" />
              Teste de Notificação
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Enviar notificação de tarefa para seu WhatsApp
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-300 mb-2">📱 Como funciona</h4>
              <p className="text-sm text-blue-200">
                Este teste enviará uma notificação de tarefa simulada para o seu WhatsApp cadastrado no perfil. 
                Certifique-se de ter configurado seu telefone nas configurações do perfil.
              </p>
            </div>

            <Button
              onClick={sendUserTestNotification}
              disabled={loading || !user}
              className="w-full bg-primary hover:bg-primary-light text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando Notificação...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Enviar Notificação de Tarefa
                </div>
              )}
            </Button>

            {!user && (
              <p className="text-sm text-text-secondary text-center mt-2">
                Você precisa estar logado para testar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}