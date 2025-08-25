"use client";

import { useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function SystemNotifications() {
  const { user, invalidateCache } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Configurando notificações do sistema...');

    // Escutar mudanças nas cozinhas
    const kitchensSubscription = supabase
      .channel('kitchens-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kitchens'
        },
        (payload) => {
          console.log('🏢 Mudança detectada em cozinhas:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new.ativo === false) {
            toast.warning('Uma cozinha foi desativada. Atualizando dados...');
          } else if (payload.eventType === 'INSERT') {
            toast.success('Nova cozinha adicionada!');
          }
          
          // Invalidar cache para forçar recarregamento
          setTimeout(() => {
            invalidateCache();
          }, 1000);
        }
      )
      .subscribe();

    // Escutar mudanças nos roles do usuário
    const rolesSubscription = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_kitchen_roles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('👤 Mudança detectada nos roles do usuário:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast.success('Você recebeu acesso a uma nova cozinha!');
          } else if (payload.eventType === 'DELETE') {
            toast.warning('Seu acesso a uma cozinha foi removido.');
          }
          
          // Invalidar cache para forçar recarregamento
          setTimeout(() => {
            invalidateCache();
          }, 1000);
        }
      )
      .subscribe();

    // Escutar mudanças nos projetos
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('📁 Mudança detectada em projetos:', payload);
          
          // Invalidar cache para atualizar estatísticas
          setTimeout(() => {
            invalidateCache();
          }, 1000);
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 Removendo notificações do sistema...');
      kitchensSubscription.unsubscribe();
      rolesSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
    };
  }, [user, invalidateCache]);

  return null; // Componente invisível
}