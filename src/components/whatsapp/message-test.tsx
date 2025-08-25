"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EvolutionConfig, Instance } from '@/hooks/use-whatsapp-config';

interface MessageTestProps {
  config: EvolutionConfig;
  instances: Instance[];
  isConnected: boolean;
}

export function MessageTest({ config, instances, isConnected }: MessageTestProps) {
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Teste de conexão WhatsApp');
  const [testing, setTesting] = useState(false);

  const hasActiveInstance = instances.some(inst => inst.state === 'open');
  const canSendTest = isConnected && instances.length > 0 && testPhone.trim();

  const sendTestMessage = async () => {
    console.log('🚀 INICIANDO ENVIO DE TESTE...');
    
    // Validações
    if (!testPhone.trim()) {
      toast.error('❌ Digite um número de telefone');
      return;
    }

    if (!isConnected) {
      toast.error('❌ Teste a conexão primeiro para verificar as instâncias');
      return;
    }

    if (instances.length === 0) {
      toast.error('❌ Nenhuma instância encontrada. Teste a conexão primeiro.');
      return;
    }

    // Encontrar instância para usar
    let instanceToUse = null;

    // 1. Tentar usar a instância configurada se estiver ativa
    const configuredInstance = instances.find(inst => 
      inst.name === config.instanceName && inst.state === 'open'
    );
    
    if (configuredInstance) {
      instanceToUse = configuredInstance.name;
      console.log('✅ Usando instância configurada ativa:', instanceToUse);
    } else {
      // 2. Procurar qualquer instância ativa
      const activeInstance = instances.find(inst => inst.state === 'open');
      if (activeInstance) {
        instanceToUse = activeInstance.name;
        console.log('✅ Usando instância ativa encontrada:', instanceToUse);
      } else {
        // 3. Usar a primeira instância disponível (mesmo que não esteja ativa)
        if (instances.length > 0) {
          instanceToUse = instances[0].name;
          console.log('⚠️ Usando primeira instância disponível (pode não estar ativa):', instanceToUse);
          toast.warning('⚠️ Nenhuma instância ativa. Tentando com a primeira disponível...');
        }
      }
    }

    if (!instanceToUse) {
      toast.error('❌ Nenhuma instância disponível para envio');
      return;
    }

    console.log('🎯 Instância selecionada para envio:', instanceToUse);

    setTesting(true);

    try {
      // Formatar número
      let phoneNumber = testPhone.replace(/\D/g, '');
      console.log('📱 Número original:', testPhone);
      console.log('📱 Número limpo:', phoneNumber);
      
      // Adicionar código do país se necessário
      if (!phoneNumber.startsWith('55') && phoneNumber.length === 11) {
        phoneNumber = '55' + phoneNumber;
        console.log('📱 Número com código do país:', phoneNumber);
      }

      // Preparar dados
      const sendUrl = `${config.apiUrl}/message/sendText/${instanceToUse}`;
      const payload = {
        number: phoneNumber,
        text: testMessage
      };

      console.log('📡 URL de envio:', sendUrl);
      console.log('📤 Payload:', payload);
      console.log('🔑 API Key:', config.apiKey.substring(0, 8) + '...');

      // Enviar mensagem
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey,
        },
        body: JSON.stringify(payload)
      });

      console.log('📊 Status da resposta:', response.status);

      const result = await response.json();
      console.log('📥 Resultado completo:', JSON.stringify(result, null, 2));

      if (response.ok) {
        if (result.key?.id) {
          toast.success(`✅ Mensagem enviada com sucesso via "${instanceToUse}"! ID: ${result.key.id}`);
          console.log('✅ Message ID:', result.key.id);
        } else {
          toast.success(`✅ Mensagem enviada via "${instanceToUse}"!`);
          console.log('✅ Resposta:', result);
        }
      } else {
        console.error('❌ Erro na resposta:', result);
        
        if (response.status === 404) {
          toast.error(`❌ Instância "${instanceToUse}" não encontrada na API`);
        } else if (response.status === 400) {
          toast.error('❌ Dados inválidos - verifique o número de telefone');
        } else if (response.status === 401) {
          toast.error('🔑 API Key inválida para envio');
        } else if (response.status === 500) {
          toast.error('💥 Erro interno da API - tente novamente');
        } else {
          toast.error(`❌ Erro ${response.status}: ${result.message || result.error || 'Erro desconhecido'}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('🌐 Erro de rede - verifique sua conexão');
      } else {
        toast.error(`❌ Erro: ${error.message}`);
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-purple-600" />
          Teste de Mensagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Número de Telefone</Label>
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="11999999999"
            />
            <p className="text-xs text-gray-500">
              Digite com DDD. Código do país (+55) será adicionado automaticamente.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={3}
            />
          </div>
        </div>
        
        <Button 
          onClick={sendTestMessage}
          disabled={testing || !canSendTest}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {testing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Enviando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Teste
            </div>
          )}
        </Button>

        {/* Alertas de validação */}
        {!isConnected && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              ❌ Teste a conexão primeiro para verificar as instâncias
            </p>
          </div>
        )}

        {isConnected && instances.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              ⚠️ Nenhuma instância encontrada na API
            </p>
          </div>
        )}

        {isConnected && instances.length > 0 && !hasActiveInstance && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              ⚠️ Nenhuma instância ativa encontrada. O envio pode falhar.
            </p>
          </div>
        )}

        {isConnected && hasActiveInstance && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              ✅ Pronto para enviar! Instância ativa encontrada.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}