"use client";

import { RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { ConnectionStatus } from '@/components/whatsapp/connection-status';
import { ConfigurationForm } from '@/components/whatsapp/configuration-form';
import { InstanceList } from '@/components/whatsapp/instance-list';
import { MessageTest } from '@/components/whatsapp/message-test';
import { useWhatsAppConfig } from '@/hooks/use-whatsapp-config';

export default function WhatsAppSettingsPage() {
  const {
    config,
    instances,
    isConnected,
    loading,
    initialized,
    updateConfig,
    selectInstance,
    saveManually,
    saveInstancePermanently,
    deleteInstance,
    testConnection
  } = useWhatsAppConfig();

  if (!initialized) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações WhatsApp</h1>
          <p className="text-gray-600">Configure a integração com Evolution API</p>
        </div>

        {/* Status da Conexão */}
        <ConnectionStatus 
          isConnected={isConnected} 
          apiUrl={config.apiUrl} 
        />

        {/* Formulário de Configurações */}
        <ConfigurationForm
          config={config}
          loading={loading}
          onUpdateConfig={updateConfig}
          onSaveManually={saveManually}
          onTestConnection={testConnection}
          onSaveInstance={saveInstancePermanently}
          onDeleteInstance={deleteInstance}
        />

        {/* Lista de Instâncias */}
        <InstanceList
          instances={instances}
          selectedInstanceName={config.instanceName}
          onSelectInstance={selectInstance}
        />

        {/* Teste de Mensagem */}
        <MessageTest
          config={config}
          instances={instances}
          isConnected={isConnected}
        />
      </div>
    </MainLayout>
  );
}