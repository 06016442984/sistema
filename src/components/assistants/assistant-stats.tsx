"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Bot, CheckCircle, XCircle, Building } from 'lucide-react';

interface Assistant {
  id: string;
  ativo: boolean;
  kitchen_id: string;
}

interface AssistantStatsProps {
  assistants: Assistant[];
  totalKitchens: number;
}

export function AssistantStats({ assistants, totalKitchens }: AssistantStatsProps) {
  const activeAssistants = assistants.filter(a => a.ativo).length;
  const inactiveAssistants = assistants.filter(a => !a.ativo).length;
  const uniqueKitchens = new Set(assistants.map(a => a.kitchen_id)).size;

  const stats = [
    {
      label: 'Total de Assistentes',
      value: assistants.length,
      icon: Bot,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Assistentes Ativos',
      value: activeAssistants,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Assistentes Inativos',
      value: inactiveAssistants,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Unidades com IA',
      value: `${uniqueKitchens}/${totalKitchens}`,
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}