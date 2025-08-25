"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface Instance {
  name: string;
  state: string;
  status: string;
}

const STORAGE_KEY = 'whatsapp_evolution_config';

const DEFAULT_CONFIG: EvolutionConfig = {
  apiUrl: 'https://n88n-evolution-api.tijjpa.easypanel.host',
  apiKey: '5746D991B38B-4181-9C59-C725B6537292',
  instanceName: 'educafit'
};

export function useWhatsAppConfig() {
  const [config, setConfig] = useState<EvolutionConfig>(DEFAULT_CONFIG);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Função para salvar no localStorage
  const saveToLocalStorage = (configToSave: EvolutionConfig): boolean => {
    try {
      const dataToSave = JSON.stringify(configToSave);
      localStorage.setItem(STORAGE_KEY, dataToSave);
      
      const verification = localStorage.getItem(STORAGE_KEY);
      if (verification === dataToSave) {
        console.log('✅ SALVOU COM SUCESSO:', configToSave);
        return true;
      } else {
        console.error('❌ FALHA NA VERIFICAÇÃO DO SALVAMENTO');
        return false;
      }
    } catch (error) {
      console.error('❌ ERRO AO SALVAR:', error);
      return false;
    }
  };

  // Carregar configurações na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📥 CARREGANDO CONFIGURAÇÕES:', parsed);
        
        // Atualizar API Key se estiver usando as antigas
        if (parsed.apiKey === '05F9D81C8C09-441A-B724-1558572D1281' || 
            parsed.apiKey === 'B6D711FCDE46-4F71-B1D7-438BDCAE6008') {
          parsed.apiKey = '5746D991B38B-4181-9C59-C725B6537292';
          console.log('🔄 API Key atualizada automaticamente para a correta');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        
        setConfig(parsed);
      }
    } catch (error) {
      console.error('❌ ERRO AO CARREGAR:', error);
    } finally {
      setInitialized(true);
    }
  }, []);

  // Salvar automaticamente quando config mudar
  useEffect(() => {
    if (initialized && config.apiUrl && config.apiKey && config.instanceName) {
      console.log('💾 AUTO-SALVANDO CONFIGURAÇÕES:', config);
      const success = saveToLocalStorage(config);
      if (!success) {
        console.error('❌ FALHA NO AUTO-SALVAMENTO');
      }
    }
  }, [config, initialized]);

  // Atualizar configurações
  const updateConfig = (field: keyof EvolutionConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    console.log(`🔄 ATUALIZANDO ${field}:`, value);
    setConfig(newConfig);
  };

  // Selecionar instância
  const selectInstance = (instanceName: string) => {
    console.log('🎯 SELECIONANDO INSTÂNCIA:', instanceName);
    const newConfig = { ...config, instanceName };
    setConfig(newConfig);
    toast.success(`✅ Instância "${instanceName}" selecionada!`);
  };

  // Salvar manualmente
  const saveManually = (): boolean => {
    console.log('💾 SALVAMENTO MANUAL INICIADO');
    const success = saveToLocalStorage(config);
    if (success) {
      toast.success('✅ Configurações salvas com sucesso!');
    } else {
      toast.error('❌ Erro ao salvar configurações');
    }
    return success;
  };

  // Salvar instância específica
  const saveInstancePermanently = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!config.instanceName.trim()) {
        toast.error('❌ Digite o nome da instância primeiro');
        resolve(false);
        return;
      }

      try {
        console.log('💾 SALVANDO INSTÂNCIA PERMANENTEMENTE:', config.instanceName);
        
        const success = saveToLocalStorage(config);
        if (success) {
          toast.success(`✅ Instância "${config.instanceName}" salva permanentemente!`);
          console.log('✅ INSTÂNCIA SALVA COM SUCESSO');
        } else {
          throw new Error('Falha ao salvar no localStorage');
        }
        resolve(success);
      } catch (error) {
        console.error('❌ ERRO AO SALVAR INSTÂNCIA:', error);
        toast.error('❌ Erro ao salvar instância');
        resolve(false);
      }
    });
  };

  // Excluir instância
  const deleteInstance = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        console.log('🗑️ EXCLUINDO INSTÂNCIA:', config.instanceName);
        
        const newConfig = { ...config, instanceName: '' };
        setConfig(newConfig);
        
        const success = saveToLocalStorage(newConfig);
        if (success) {
          toast.success('✅ Instância excluída com sucesso!');
          console.log('✅ INSTÂNCIA EXCLUÍDA');
        } else {
          throw new Error('Falha ao salvar alteração');
        }
        resolve(success);
      } catch (error) {
        console.error('❌ ERRO AO EXCLUIR INSTÂNCIA:', error);
        toast.error('❌ Erro ao excluir instância');
        resolve(false);
      }
    });
  };

  // Testar conexão
  const testConnection = async (): Promise<boolean> => {
    if (!config.apiUrl || !config.apiKey) {
      toast.error('❌ Configure URL e API Key primeiro');
      return false;
    }

    setLoading(true);
    setIsConnected(false);
    setInstances([]);

    try {
      console.log('🔄 TESTANDO CONEXÃO...');
      console.log('📡 URL:', config.apiUrl);
      console.log('🔑 API Key:', config.apiKey.substring(0, 8) + '...');
      
      const response = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      console.log('📊 Status da resposta:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 RESPOSTA COMPLETA DA API:', JSON.stringify(data, null, 2));

        const formattedInstances = data.map((inst: any, index: number) => {
          console.log(`📱 Processando instância ${index}:`, inst);
          
          let instanceName = 'Desconhecido';
          let instanceState = 'unknown';

          if (inst.instance) {
            instanceName = inst.instance.instanceName || inst.instance.name || instanceName;
            instanceState = inst.instance.state || instanceState;
          } else {
            instanceName = inst.instanceName || inst.name || instanceName;
            instanceState = inst.state || instanceState;
          }

          console.log(`✅ Instância formatada: ${instanceName} (${instanceState})`);

          return {
            name: instanceName,
            state: instanceState,
            status: instanceState
          };
        });

        console.log('📋 TODAS AS INSTÂNCIAS FORMATADAS:', formattedInstances);

        setInstances(formattedInstances);
        setIsConnected(true);
        toast.success(`✅ Conectado! ${formattedInstances.length} instância(s) encontrada(s)`);

        // Verificar se a instância configurada existe
        const configuredInstanceExists = formattedInstances.find(inst => inst.name === config.instanceName);
        if (configuredInstanceExists) {
          console.log(`✅ Instância configurada "${config.instanceName}" encontrada:`, configuredInstanceExists);
          toast.info(`📱 Instância "${config.instanceName}" encontrada (${configuredInstanceExists.state})`);
        } else {
          console.log(`⚠️ Instância configurada "${config.instanceName}" NÃO encontrada`);
          
          // Auto-selecionar primeira instância ativa
          const activeInstance = formattedInstances.find(inst => inst.state === 'open');
          if (activeInstance) {
            console.log('🎯 Auto-selecionando instância ativa:', activeInstance.name);
            selectInstance(activeInstance.name);
            toast.warning(`⚠️ Instância "${config.instanceName}" não encontrada. Selecionada "${activeInstance.name}"`);
          } else {
            toast.warning('⚠️ Nenhuma instância ativa encontrada');
          }
        }

        return true;
      } else {
        setIsConnected(false);
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', response.status, errorText);
        
        if (response.status === 401) {
          toast.error('🔑 API Key inválida ou expirada - Vá em Configurações > WhatsApp para atualizar');
        } else if (response.status === 404) {
          toast.error('❌ URL da API não encontrada - verifique o endereço');
        } else if (response.status === 403) {
          toast.error('🚫 Acesso negado - verifique as permissões');
        } else {
          toast.error(`❌ Erro ${response.status}: ${response.statusText}`);
        }
        return false;
      }
    } catch (error: any) {
      console.error('❌ ERRO NA CONEXÃO:', error);
      setIsConnected(false);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('🌐 Erro de rede - verifique a URL e sua conexão');
      } else if (error.message.includes('CORS')) {
        toast.error('🔒 Erro de CORS - API pode não permitir acesso do navegador');
      } else {
        toast.error(`❌ Erro: ${error.message}`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}