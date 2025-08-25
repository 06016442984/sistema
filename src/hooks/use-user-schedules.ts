"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UserSchedule {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

export function useUserSchedules() {
  const [users, setUsers] = useState<UserSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, hora_inicio, hora_fim, ativo')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        ...user,
        hora_inicio: user.hora_inicio || '08:00',
        hora_fim: user.hora_fim || '17:00'
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const updateUserSchedule = async (userId: string, field: 'hora_inicio' | 'hora_fim', value: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, [field]: value } : user
      ));

      toast.success('Horário atualizado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar horário:', error);
      toast.error('Erro ao atualizar horário');
    }
  };

  const updateUserScheduleLocal = (userId: string, field: 'hora_inicio' | 'hora_fim', value: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ));
  };

  const saveAllSchedules = async () => {
    try {
      setSaving(true);
      
      const updates = users.map(user => ({
        id: user.id,
        hora_inicio: user.hora_inicio,
        hora_fim: user.hora_fim
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('profiles')
          .update({
            hora_inicio: update.hora_inicio,
            hora_fim: update.hora_fim
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Todos os horários foram salvos com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    saving,
    updateUserSchedule,
    updateUserScheduleLocal,
    saveAllSchedules,
    loadUsers
  };
}