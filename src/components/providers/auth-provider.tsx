"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Profile, UserKitchenRole } from '@/types/database';

interface AuthContextType {
  user: Profile | null;
  supabaseUser: User | null;
  userRoles: UserKitchenRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserKitchenRole[]>([]);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setUserRoles([]);
      
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Forçar limpeza mesmo com erro
      setUser(null);
      setSupabaseUser(null);
      setUserRoles([]);
      window.location.href = '/login';
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Erro de autenticação:', error);
    
    // Verificar se é erro de refresh token
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token') ||
        error?.code === 'invalid_refresh_token') {
      
      toast.error('Sessão expirada. Faça login novamente.');
      signOut();
      return;
    }

    // Outros erros de autenticação
    if (error?.message?.includes('JWT expired') || 
        error?.message?.includes('invalid_token')) {
      
      toast.error('Token de acesso expirado. Faça login novamente.');
      signOut();
      return;
    }

    // Log outros erros sem fazer logout
    console.warn('Erro de autenticação não crítico:', error);
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado para o usuário:', userId);
          return null;
        }
        throw profileError;
      }

      return profile;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  };

  const loadUserRoles = async (userId: string) => {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_kitchen_roles')
        .select(`
          *,
          kitchens(id, nome, codigo, ativo)
        `)
        .eq('user_id', userId);

      if (rolesError) {
        throw rolesError;
      }

      return roles || [];
    } catch (error) {
      handleAuthError(error);
      return [];
    }
  };

  const refreshUserData = async () => {
    try {
      const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError) {
        handleAuthError(sessionError);
        return;
      }

      if (!currentUser) {
        setUser(null);
        setSupabaseUser(null);
        setUserRoles([]);
        return;
      }

      setSupabaseUser(currentUser);

      // Carregar perfil do usuário
      const profile = await loadUserProfile(currentUser.id);
      if (profile) {
        setUser(profile);

        // Carregar funções do usuário
        const roles = await loadUserRoles(currentUser.id);
        setUserRoles(roles);
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  useEffect(() => {
    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          handleAuthError(sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Carregar dados do usuário
          const profile = await loadUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
            const roles = await loadUserRoles(session.user.id);
            setUserRoles(roles);
          }
        }
      } catch (error) {
        handleAuthError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      try {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSupabaseUser(null);
          setUserRoles([]);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSupabaseUser(session.user);
          
          const profile = await loadUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
            const roles = await loadUserRoles(session.user.id);
            setUserRoles(roles);
          }
          setLoading(false);
        }

        if (event === 'USER_UPDATED') {
          await refreshUserData();
          setLoading(false);
        }
      } catch (error) {
        handleAuthError(error);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    supabaseUser,
    userRoles,
    loading,
    signOut,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}