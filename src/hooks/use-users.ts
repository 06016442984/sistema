"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Profile, UserKitchenRole } from '@/types/database';

export interface UserWithRoles extends Profile {
  user_kitchen_roles?: UserKitchenRole[];
}

interface UseUsersProps {
  userRoles: UserKitchenRole[];
  searchTerm: string;
  selectedKitchen: string;
  selectedRole: string;
}

export function useUsers({ userRoles, searchTerm, selectedKitchen, selectedRole }: UseUsersProps) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Iniciando carregamento de usuários...');

      // Carregar usuários básicos incluindo horários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, hora_inicio, hora_fim, ativo, criado_em')
        .eq('ativo', true)
        .order('nome');

      if (usersError) {
        console.log('❌ Erro ao carregar usuários:', usersError);
        setError(`Erro ao carregar usuários: ${usersError.message}`);
        return;
      }

      console.log('✅ Usuários carregados:', usersData?.length || 0);

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        setError('Nenhum usuário encontrado na base de dados');
        return;
      }

      // Carregar funções para cada usuário
      const usersWithRoles: UserWithRoles[] = [];

      for (const user of usersData) {
        try {
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_kitchen_roles')
            .select(`
              *,
              kitchens(id, nome, codigo)
            `)
            .eq('user_id', user.id);

          if (rolesError) {
            console.log('⚠️ Erro ao carregar funções do usuário:', user.email);
            usersWithRoles.push({
              ...user,
              user_kitchen_roles: []
            });
          } else {
            usersWithRoles.push({
              ...user,
              user_kitchen_roles: rolesData || []
            });
          }
        } catch (error) {
          usersWithRoles.push({
            ...user,
            user_kitchen_roles: []
          });
        }
      }

      // Aplicar filtros
      let filteredUsers = usersWithRoles;

      // Filtrar por cozinha
      if (selectedKitchen !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          user.user_kitchen_roles?.some(role => role.kitchen_id === selectedKitchen)
        );
      }

      // Filtrar por função
      if (selectedRole !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          user.user_kitchen_roles?.some(role => role.role === selectedRole)
        );
      }

      // Filtrar por termo de busca
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.telefone && user.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setUsers(filteredUsers);
      console.log('✅ Usuários processados:', filteredUsers.length);

    } catch (error: any) {
      console.log('💥 Erro geral:', error);
      setError(`Erro geral: ${error.message || 'Erro desconhecido'}`);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsers();
    } catch (error) {
      toast.error('Erro ao alterar status do usuário');
    }
  };

  useEffect(() => {
    if (userRoles.length > 0) {
      loadUsers();
    }
  }, [userRoles, searchTerm, selectedKitchen, selectedRole]);

  return {
    users,
    loading,
    error,
    loadUsers,
    toggleUserStatus
  };
}