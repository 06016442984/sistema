export const formatTime = (time: string): string => {
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return time;
  }
};

export const calculateReminderTimes = (inicio: string, fim: string, frequency: number): string[] => {
  try {
    const startTime = new Date(`2000-01-01T${inicio}`);
    const endTime = new Date(`2000-01-01T${fim}`);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    const times = [];
    
    if (frequency >= 1) {
      times.push(formatTime(inicio)); // Início
    }
    
    if (frequency >= 2) {
      const midTime = new Date(startTime.getTime() + (totalMinutes / 2) * 60 * 1000);
      times.push(midTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })); // Meio
    }
    
    if (frequency >= 3) {
      times.push(formatTime(fim)); // Fim
    }
    
    return times;
  } catch {
    return ['08:00', '12:00', '17:00'].slice(0, frequency);
  }
};

export const testReminders = async (): Promise<void> => {
  // Simular teste do sistema
  await new Promise(resolve => setTimeout(resolve, 2000));
};