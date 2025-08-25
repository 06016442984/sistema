"use client";

import { useState } from 'react';

export interface ReminderSettings {
  alta_prioridade: {
    enabled: boolean;
    frequency: number;
    times: string[];
  };
  media_prioridade: {
    enabled: boolean;
    frequency: number;
    times: string[];
  };
  baixa_prioridade: {
    enabled: boolean;
    frequency: number;
    times: string[];
  };
}

const DEFAULT_SETTINGS: ReminderSettings = {
  alta_prioridade: {
    enabled: true,
    frequency: 3,
    times: ['início', 'meio', 'fim']
  },
  media_prioridade: {
    enabled: true,
    frequency: 2,
    times: ['início', 'meio']
  },
  baixa_prioridade: {
    enabled: true,
    frequency: 1,
    times: ['início']
  }
};

export function useReminderSettings() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);

  const updatePrioritySettings = (
    priority: keyof ReminderSettings,
    field: keyof ReminderSettings['alta_prioridade'],
    value: any
  ) => {
    setReminderSettings(prev => ({
      ...prev,
      [priority]: {
        ...prev[priority],
        [field]: value
      }
    }));
  };

  const togglePriority = (priority: keyof ReminderSettings, enabled: boolean) => {
    updatePrioritySettings(priority, 'enabled', enabled);
  };

  return {
    reminderSettings,
    updatePrioritySettings,
    togglePriority
  };
}