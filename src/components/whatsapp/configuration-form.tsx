"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, RefreshCw, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import type { EvolutionConfig } from '@/hooks/use-whatsapp-config';

interface ConfigurationFormProps {
  config: EvolutionConfig;
  loading: boolean;
  onUpdateConfig: (field: keyof EvolutionConfig, value: string) => void;
  onSaveManually: () => void;
  onTestConnection: () => Promise<boolean>;
  onSaveInstance: () => Promise<boolean>;
  onDeleteInstance: () => Promise<boolean>;
}

export function ConfigurationForm({
  config,
  loading,
  onUpdateConfig,
  onSaveManually,
  onTestConnection,
  onSaveInstance,
  onDeleteInstance
}: ConfigurationFormProps) {
  const [savingInstance, setSavingInstance] = useState(false);
  const [deletingInstance, setDeletingInstance] = useState(false);

  const handleSaveInstance = async () => {
    setSavingInstance(true);
    await onSaveInstance();
    setSavingInstance(false);
  };

  const handleDeleteInstance = async () => {
    setDeletingInstance(true);
    await onDeleteInstance();
    setDeletingInstance(false);
  };

  // Verificar se está usando API Key antiga
  const isUsingOldApiKey = config.apiKey === '05F9D81C8C09-441A-B724-1558572D1281' || 
                           config.apiKey === 'B6D711FCDE46-4F71-B1D7-438BDCAE6008';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-blue-600" />
          Configuração da Evolution API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta sobre API Key antiga */}
        {isUsingOldApiKey && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ API Key antiga detectada!
              </p>
              <p className="text-xs text-red-700">
                Atualize para: 5746D991B38B-4181-9C59-C725B6537292
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onUpdateConfig('apiKey', '5746D991B38B-4181-9C59-C725B6537292')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Atualizar
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input
              value={config.apiUrl}
              onChange={(e) => onUpdateConfig('apiUrl', e.target.value)}
              placeholder="https://api.evolution.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Chave da API</Label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={(e) => onUpdateConfig('apiKey', e.target.value)}
              placeholder="Sua chave da API"
              className={isUsingOldApiKey ? 'border-red-300 focus:border-red-500' : ''}
            />
            {isUsingOldApiKey && (
              <p className="text-xs text-red-600">
                Esta API Key está expirada. Use a nova acima.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nome da Instância</Label>
            <Input
              value={config.instanceName}
              onChange={(e) => onUpdateConfig('instanceName', e.target.value)}
              placeholder="Nome da instância"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={onSaveManually} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
          
          <Button onClick={onTestConnection} disabled={loading} variant="outline">
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
            Testar Conexão
          </Button>

          <Button 
            onClick={handleSaveInstance} 
            disabled={savingInstance || !config.instanceName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {savingInstance ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Salvar Instância
              </div>
            )}
          </Button>

          <Button 
            onClick={handleDeleteInstance} 
            disabled={deletingInstance || !config.instanceName.trim()}
            variant="destructive"
          >
            {deletingInstance ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Excluindo...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir Instância
              </div>
            )}
          </Button>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ Configurações são salvas automaticamente quando você digita
          </p>
        </div>

        {config.instanceName && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              📱 Instância atual: <strong>{config.instanceName}</strong>
            </p>
          </div>
        )}

        {/* Informações sobre API Key correta */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            🔑 <strong>API Key atual:</strong> 5746D991B38B-4181-9C59-C725B6537292
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Se estiver com erro de autorização, use esta API Key atualizada.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}