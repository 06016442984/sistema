"use client";

import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, Clock } from 'lucide-react';

export function UserStats() {
  return (
    <>
      {/* Info sobre Sistema */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ChefHat className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Sistema Multi-Cozinha com Lembretes Inteligentes</p>
              <p>• Cada usuário pode ter acesso a <strong>múltiplas cozinhas</strong></p>
              <p>• <strong>WhatsApp obrigatório</strong> para receber notificações de tarefas</p>
              <p>• <strong>Horários de trabalho</strong> definem quando enviar lembretes</p>
              <p>• <strong>Lembretes automáticos</strong> baseados na prioridade das tarefas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info sobre Lembretes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sistema de Lembretes por Prioridade</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="font-medium text-red-700">🔴 Alta Prioridade</p>
                  <p className="text-xs">4 lembretes: delegação + início + meio + fim da jornada</p>
                </div>
                <div>
                  <p className="font-medium text-yellow-700">🟡 Média Prioridade</p>
                  <p className="text-xs">3 lembretes: delegação + início + meio da jornada</p>
                </div>
                <div>
                  <p className="font-medium text-green-700">🟢 Baixa Prioridade</p>
                  <p className="text-xs">1 lembrete: início da jornada</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}