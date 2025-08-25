"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';

interface DashboardStats {
  totalKitchens: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingReminders: number;
  activeAssistants: number;
}

export function useDashboardData() {
  const { user, userRoles } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalKitchens: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingReminders: 0,
    activeAssistants: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userRoles || userRoles.length === 0) {
      setStats({
        totalKitchens: 0,
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingReminders: 0,
        activeAssistants: 0
      });
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔄 Carregando dados do dashboard...');

      // Obter IDs das unidades que o usuário tem acesso
      const kitchenIds = userRoles.map(role => role.kitchen_id);
      
      // Verificar se as unidades ainda estão ativas
      const { data: activeKitchens, error: kitchensError } = await supabase
        .from('kitchens')
        .select('id, nome, codigo')
        .in('id', kitchenIds)
        .eq('ativo', true);

      if (kitchensError) {
        throw kitchensError;
      }

      const activeKitchenIds = activeKitchens?.map(k => k.id) || [];

      if (activeKitchenIds.length === 0) {
        setStats({
          totalKitchens: 0,
          totalProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingReminders: 0,
          activeAssistants: 0
        });
        return;
      }

      // Carregar dados em paralelo
      const [projectsResult, assistantsResult, remindersResult] = await Promise.allSettled([
        // Projetos ativos (não finalizados)
        supabase
          .from('projects')
          .select('id, status')
          .in('kitchen_id', activeKitchenIds)
          .in('status', ['ATIVO', 'PAUSADO']), // Apenas ativos e pausados, não concluídos
        
        // Assistentes ativos
        supabase
          .from('kitchen_assistants')
          .select('id')
          .in('kitchen_id', activeKitchenIds)
          .eq('ativo', true),
        
        // Lembretes pendentes do usuário
        user?.id ? supabase
          .from('task_reminders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('sent', false)
          .lte('scheduled_time', new Date().toISOString()) : Promise.resolve({ count: 0 })
      ]);

      // Processar resultados dos projetos
      const projects = projectsResult.status === 'fulfilled' ? projectsResult.value.data || [] : [];
      const projectIds = projects.map(p => p.id);

      // Carregar tarefas se há projetos
      let totalTasks = 0;
      let completedTasks = 0;

      if (projectIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status')
          .in('project_id', projectIds);

        totalTasks = tasks?.length || 0;
        completedTasks = tasks?.filter(t => t.status === 'CONCLUIDA').length || 0;
      }

      // Processar outros resultados
      const activeAssistants = assistantsResult.status === 'fulfilled' ? 
        (assistantsResult.value.data?.length || 0) : 0;
      
      const pendingReminders = remindersResult.status === 'fulfilled' ? 
        (remindersResult.value.count || 0) : 0;

      // Atualizar stats
      setStats({
        totalKitchens: activeKitchenIds.length,
        totalProjects: projectIds.length,
        totalTasks,
        completedTasks,
        pendingReminders,
        activeAssistants
      });

      console.log('✅ Dashboard carregado com sucesso:', {
        unidades: activeKitchenIds.length,
        projetos: projectIds.length,
        tarefas: totalTasks,
        assistentes: activeAssistants
      });

    } catch (err: any) {
      console.error('💥 Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRoles]);

  // Carregar dados quando userRoles mudar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  return {
    stats,
    loading,
    error,
    refresh
  };
}