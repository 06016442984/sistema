// Utilitário para carregar configurações do WhatsApp

export interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

const STORAGE_KEY = 'whatsapp_evolution_config';

// Configurações padrão como fallback
const DEFAULT_CONFIG: WhatsAppConfig = {
  apiUrl: 'https://n88n-evolution-api.tijjpa.easypanel.host',
  apiKey: '05F9D81C8C09-441A-B724-1558572D1281',
  instanceName: 'educafit'
};

/**
 * Carrega as configurações do WhatsApp do localStorage
 */
export function loadWhatsAppConfig(): WhatsAppConfig {
  try {
    if (typeof window === 'undefined') {
      // Se estiver no servidor, usar configurações padrão
      return DEFAULT_CONFIG;
    }

    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      console.log('✅ Configurações WhatsApp carregadas:', {
        apiUrl: parsed.apiUrl,
        apiKey: parsed.apiKey?.substring(0, 8) + '...',
        instanceName: parsed.instanceName
      });
      
      return {
        apiUrl: parsed.apiUrl || DEFAULT_CONFIG.apiUrl,
        apiKey: parsed.apiKey || DEFAULT_CONFIG.apiKey,
        instanceName: parsed.instanceName || DEFAULT_CONFIG.instanceName
      };
    }

    console.log('⚠️ Nenhuma configuração salva, usando padrão');
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('❌ Erro ao carregar configurações WhatsApp:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Salva as configurações do WhatsApp no localStorage
 */
export function saveWhatsAppConfig(config: WhatsAppConfig): boolean {
  try {
    if (typeof window === 'undefined') {
      console.warn('⚠️ Tentativa de salvar no servidor ignorada');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('💾 Configurações WhatsApp salvas');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configurações WhatsApp:', error);
    return false;
  }
}

/**
 * Verifica se as configurações estão válidas
 */
export function validateWhatsAppConfig(config: WhatsAppConfig): boolean {
  return !!(config.apiUrl && config.apiKey && config.instanceName);
}