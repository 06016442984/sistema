"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, MessageSquare, Wifi, Settings } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

export default function EvolutionPage() {
  const { userRoles } = useAuth();
  const isAdmin = userRoles.some(role => role.role === 'ADMIN');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md glass-card">
          <CardContent className="pt-6 text-center">
            <Smartphone className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Acesso Restrito</h3>
            <p className="text-text-secondary">
              Apenas administradores podem acessar as configurações da Evolution API.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Evolution API</h1>
        <p className="text-text-secondary">
          Configurações e monitoramento da integração WhatsApp
        </p>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Wifi className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-text-primary">Status da API</CardTitle>
                <CardDescription className="text-text-secondary">
                  Conexão ativa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>API Online</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Instância Conectada</span>
              </div>
              
              <div className="pt-2">
                <div className="w-full bg-glass-bg rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-full"></div>
                </div>
                <p className="text-xs text-text-secondary mt-1">100% Operacional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-text-primary">Mensagens Hoje</CardTitle>
                <CardDescription className="text-text-secondary">
                  Enviadas automaticamente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="text-3xl font-bold text-text-primary mb-2">24</div>
            <div className="text-sm text-text-secondary">
              <span className="text-green-400">+12%</span> vs ontem
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-text-primary">Configurações</CardTitle>
                <CardDescription className="text-text-secondary">
                  Acesso às configurações
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-text-secondary">
              Use a página de Configurações para gerenciar a Evolution API, testar conexões e enviar mensagens.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      <div className="glass-card p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-text-primary">Sobre a Evolution API</CardTitle>
          <CardDescription className="text-text-secondary">
            Integração WhatsApp para notificações automáticas
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-0">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-text-primary mb-2">Funcionalidades</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>• Envio automático de notificações de tarefas</li>
                <li>• Sistema de lembretes baseado em prioridade</li>
                <li>• Integração com horários de trabalho dos usuários</li>
                <li>• Monitoramento de status em tempo real</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-text-primary mb-2">Configuração</h4>
              <p className="text-sm text-text-secondary">
                Para configurar a Evolution API, acesse a página de Configurações onde você pode:
                testar conexões, gerenciar instâncias, enviar mensagens de teste e configurar lembretes automáticos.
              </p>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}