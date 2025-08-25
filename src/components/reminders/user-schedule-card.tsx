"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface UserSchedule {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

interface UserScheduleCardProps {
  user: UserSchedule;
  onUpdateSchedule: (userId: string, field: 'hora_inicio' | 'hora_fim', value: string) => void;
  onScheduleChange: (userId: string, field: 'hora_inicio' | 'hora_fim', value: string) => void;
  calculateReminderTimes: (inicio: string, fim: string, frequency: number) => string[];
}

export function UserScheduleCard({
  user,
  onUpdateSchedule,
  onScheduleChange,
  calculateReminderTimes
}: UserScheduleCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
      <div className="md:col-span-2">
        <Label className="text-sm font-medium">{user.nome}</Label>
        <p className="text-xs text-gray-500">{user.email}</p>
        {user.telefone ? (
          <p className="text-xs text-green-600">📱 {user.telefone}</p>
        ) : (
          <p className="text-xs text-red-600">❌ Sem telefone</p>
        )}
      </div>
      
      <div>
        <Label className="text-xs">Início</Label>
        <Input
          type="time"
          value={user.hora_inicio}
          onChange={(e) => onScheduleChange(user.id, 'hora_inicio', e.target.value)}
          onBlur={(e) => onUpdateSchedule(user.id, 'hora_inicio', e.target.value)}
          className="text-sm"
        />
      </div>
      
      <div>
        <Label className="text-xs">Fim</Label>
        <Input
          type="time"
          value={user.hora_fim}
          onChange={(e) => onScheduleChange(user.id, 'hora_fim', e.target.value)}
          onBlur={(e) => onUpdateSchedule(user.id, 'hora_fim', e.target.value)}
          className="text-sm"
        />
      </div>
      
      <div>
        <Label className="text-xs">Lembretes</Label>
        <div className="space-y-1">
          <div className="text-xs">
            <Badge variant="destructive" className="text-xs mr-1">Alta:</Badge>
            {calculateReminderTimes(user.hora_inicio, user.hora_fim, 3).join(', ')}
          </div>
          <div className="text-xs">
            <Badge variant="secondary" className="text-xs mr-1">Média:</Badge>
            {calculateReminderTimes(user.hora_inicio, user.hora_fim, 2).join(', ')}
          </div>
          <div className="text-xs">
            <Badge variant="secondary" className="text-xs mr-1 bg-green-100 text-green-800">Baixa:</Badge>
            {calculateReminderTimes(user.hora_inicio, user.hora_fim, 1).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}