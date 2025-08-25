"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Clock, 
  Bot, 
  FileText,
  Settings,
  ArrowRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'WhatsApp & API',
      description: 'Configure integrações com WhatsApp e APIs externas',
      icon: Smartphone,
      href: '/settings/whatsapp',
      color: 'bg-green-500',
    },
    {
      title: 'Lembretes',
      description: 'Configurações de notificações e lembretes automáticos',
      icon: Clock,
      href: '/settings/reminders',
      color: 'bg-blue-500',
    },
    {
      title: 'IA & Integrações',
      description: 'Configurações de inteligência artificial e integrações',
      icon: Bot,
      href: '/settings/ai',
      color: 'bg-purple-500',
    },
    {
      title: 'Contratos',
      description: 'Gerenciamento de contratos e documentos',
      icon: FileText,
      href: '/settings/contracts',
      color: 'bg-orange-500',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Configurações</h1>
          <p className="text-text-secondary">
            Gerencie as configurações do sistema e integrações
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsCategories.map((category) => (
            <Link key={category.title} href={category.href}>
              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-text-primary group-hover:text-primary transition-colors">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-text-secondary">
                        {category.description}
                      </CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* General Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-text-primary">Configurações Gerais</CardTitle>
            <CardDescription className="text-text-secondary">
              Configurações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-glass-bg rounded-lg">
              <div>
                <h3 className="font-medium text-text-primary">Modo Escuro</h3>
                <p className="text-sm text-text-secondary">Alternar entre tema claro e escuro</p>
              </div>
              <Button variant="outline" className="bg-glass-bg border-glass-border text-text-primary">
                Configurar
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-glass-bg rounded-lg">
              <div>
                <h3 className="font-medium text-text-primary">Idioma</h3>
                <p className="text-sm text-text-secondary">Definir idioma do sistema</p>
              </div>
              <Button variant="outline" className="bg-glass-bg border-glass-border text-text-primary">
                Português (BR)
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-glass-bg rounded-lg">
              <div>
                <h3 className="font-medium text-text-primary">Fuso Horário</h3>
                <p className="text-sm text-text-secondary">Configurar fuso horário padrão</p>
              </div>
              <Button variant="outline" className="bg-glass-bg border-glass-border text-text-primary">
                UTC-3 (Brasília)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}