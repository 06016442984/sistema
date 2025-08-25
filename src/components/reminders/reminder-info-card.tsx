"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export function ReminderInfoCard() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Settings className="h-5 w-5" />
          Como Funciona o Sistema de Lembretes
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-blue-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">🔴 Alta Prioridade</h4>
            <ul className="space-y-1 text-xs">
              <li>• 3 lembretes por dia</li>
              <li>• Início do expediente</li>
              <li>• Meio do expediente</li>
              <li>• Final do expediente</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">🟡 Média Prioridade</h4>
            <ul className="space-y-1 text-xs">
              <li>• 2 lembretes por dia</li>
              <li>• Início do expediente</li>
              <li>• Meio do expediente</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">🟢 Baixa Prioridade</h4>
            <ul className="space-y-1 text-xs">
              <li>• 1 lembrete por dia</li>
              <li>• Apenas no início do expediente</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded border border-blue-300">
          <p className="text-xs">
            <strong>📱 Importante:</strong> Lembretes são enviados apenas para usuários com telefone cadastrado. 
            Os horários são calculados automaticamente baseados no expediente de cada usuário.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}