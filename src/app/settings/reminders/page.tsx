"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Users, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

import { PriorityCard } from '@/components/reminders/priority-card';
import { UserScheduleCard } from '@/components/reminders/user-schedule-card';
import { ReminderInfoCard } from '@/components/reminders/reminder-info-card';
import { useReminderSettings } from '@/hooks/use-reminder-settings';
import { useUserSchedules } from '@/hooks/use-user-schedules';
import { calculateReminderTimes, testReminders } from '@/lib/reminder-utils';

export default function RemindersPage() {
  const { reminderSettings, togglePriority } = useReminderSettings();
  const { 
    users, 
    loading, 
    saving, 
    updateUserSchedule, 
    updateUserScheduleLocal, 
    saveAllSchedules 
  } = useUserSchedules();

  const handleTestReminders = async () => {
    try {
      toast.info('🧪 Testando sistema de lembretes...');
      await testReminders();
      toast.success('✅ Sistema de lembretes funcionando corretamente!');
    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      toast.error('Erro ao testar lembretes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações de Lembretes</h1>
          <p className="text-gray-600 mt-2">
            Configure os horários de trabalho e frequência de lembretes por prioridade
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleTestReminders} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Testar Lembretes
          </Button>
          
          <Button onClick={saveAllSchedules} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Configurações de Prioridade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PriorityCard
          type="alta"
          title="Alta Prioridade"
          icon={<AlertTriangle className="h-5 w-5" />}
          enabled={reminderSettings.alta_prioridade.enabled}
          frequency={reminderSettings.alta_prioridade.frequency}
          times={reminderSettings.alta_prioridade.times}
          description={[
            '📅 Início do expediente',
            '⏰ Meio do expediente',
            '🌅 Final do expediente'
          ]}
          onToggle={(enabled) => togglePriority('alta_prioridade', enabled)}
          colorClasses={{
            border: 'border-red-200',
            header: 'bg-red-50',
            title: 'text-red-800'
          }}
        />

        <PriorityCard
          type="media"
          title="Média Prioridade"
          icon={<Clock className="h-5 w-5" />}
          enabled={reminderSettings.media_prioridade.enabled}
          frequency={reminderSettings.media_prioridade.frequency}
          times={reminderSettings.media_prioridade.times}
          description={[
            '📅 Início do expediente',
            '⏰ Meio do expediente'
          ]}
          onToggle={(enabled) => togglePriority('media_prioridade', enabled)}
          colorClasses={{
            border: 'border-yellow-200',
            header: 'bg-yellow-50',
            title: 'text-yellow-800'
          }}
        />

        <PriorityCard
          type="baixa"
          title="Baixa Prioridade"
          icon={<CheckCircle className="h-5 w-5" />}
          enabled={reminderSettings.baixa_prioridade.enabled}
          frequency={reminderSettings.baixa_prioridade.frequency}
          times={reminderSettings.baixa_prioridade.times}
          description={[
            '📅 Apenas no início do expediente'
          ]}
          onToggle={(enabled) => togglePriority('baixa_prioridade', enabled)}
          colorClasses={{
            border: 'border-green-200',
            header: 'bg-green-50',
            title: 'text-green-800',
            badge: 'bg-green-100 text-green-800'
          }}
        />
      </div>

      {/* Horários dos Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Horários de Trabalho dos Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <UserScheduleCard
                key={user.id}
                user={user}
                onUpdateSchedule={updateUserSchedule}
                onScheduleChange={updateUserScheduleLocal}
                calculateReminderTimes={calculateReminderTimes}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <ReminderInfoCard />
    </div>
  );
}