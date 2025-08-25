import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'dashboard-cozinhas'
    }
  }
});

// Interceptador para erros de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Limpar dados locais quando usuário faz logout
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  }
});

// Função para verificar e tratar erros de autenticação
export const handleSupabaseError = (error: any) => {
  if (!error) return false;

  const isAuthError = 
    error?.message?.includes('refresh_token_not_found') ||
    error?.message?.includes('Invalid Refresh Token') ||
    error?.message?.includes('JWT expired') ||
    error?.code === 'invalid_refresh_token' ||
    error?.status === 401;

  if (isAuthError) {
    console.warn('Erro de autenticação detectado:', error);
    
    // Fazer logout e redirecionar
    supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    }).catch(() => {
      // Forçar redirecionamento mesmo se logout falhar
      window.location.href = '/login';
    });
    
    return true;
  }

  return false;
};