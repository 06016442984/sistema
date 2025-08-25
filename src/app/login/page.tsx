"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChefHat, AlertCircle, Sparkles } from 'lucide-react';

function LoginAlerts() {
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  // Verificar se há mensagem de sessão expirada
  const sessionExpired = searchParams?.get('session_expired') === 'true';
  const message = searchParams?.get('message');

  return (
    <>
      {/* Alertas */}
      {sessionExpired && (
        <Alert className="glass-card border-orange-400/30 bg-orange-500/10 mb-6">
          <AlertCircle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-200">
            Sua sessão expirou. Faça login novamente para continuar.
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="glass-card border-blue-400/30 bg-blue-500/10 mb-6">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert className="glass-card border-red-400/30 bg-red-500/10 mb-6">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            {authError}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function LoginContent() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Escutar erros de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="login-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="login-container">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-slate-300">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Floating Particles */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="login-card fade-in">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center logo-glow p-2">
                <img 
                  src="https://i.imgur.com/MXCXuAA.png" 
                  alt="Grupo Pkj" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Grupo Pkj Manager
          </h1>
          <p className="text-slate-400 text-sm">
            Sistema de gestão premium multi-cozinha
          </p>
        </div>

        <Suspense fallback={<div className="h-4" />}>
          <LoginAlerts />
        </Suspense>

        {/* Formulário de Login */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-slate-400 text-sm">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <div className="auth-container">
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#7c3aed',
                      brandAccent: '#a855f7',
                      brandButtonText: 'white',
                      defaultButtonBackground: 'rgba(255, 255, 255, 0.05)',
                      defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.1)',
                      defaultButtonBorder: 'rgba(255, 255, 255, 0.1)',
                      defaultButtonText: '#94a3b8',
                      dividerBackground: 'rgba(255, 255, 255, 0.1)',
                      inputBackground: 'rgba(255, 255, 255, 0.05)',
                      inputBorder: 'rgba(255, 255, 255, 0.1)',
                      inputBorderHover: '#7c3aed',
                      inputBorderFocus: '#a855f7',
                      inputText: 'white',
                      inputLabelText: '#94a3b8',
                      inputPlaceholder: '#64748b',
                      messageText: '#94a3b8',
                      messageTextDanger: '#ef4444',
                      anchorTextColor: '#a855f7',
                      anchorTextHoverColor: '#c084fc',
                    },
                    space: {
                      spaceSmall: '4px',
                      spaceMedium: '8px',
                      spaceLarge: '16px',
                      labelBottomMargin: '8px',
                      anchorBottomMargin: '4px',
                      emailInputSpacing: '4px',
                      socialAuthSpacing: '4px',
                      buttonPadding: '12px 24px',
                      inputPadding: '12px 16px',
                    },
                    fontSizes: {
                      baseBodySize: '14px',
                      baseInputSize: '14px',
                      baseLabelSize: '14px',
                      baseButtonSize: '14px',
                    },
                    fonts: {
                      bodyFontFamily: 'Inter, sans-serif',
                      buttonFontFamily: 'Inter, sans-serif',
                      inputFontFamily: 'Inter, sans-serif',
                      labelFontFamily: 'Inter, sans-serif',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '12px',
                      buttonBorderRadius: '12px',
                      inputBorderRadius: '12px',
                    },
                  },
                },
                className: {
                  container: 'auth-container-custom',
                  button: 'auth-button-custom',
                  input: 'auth-input-custom',
                  label: 'auth-label-custom',
                },
              }}
              theme="dark"
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Senha',
                    button_label: 'Entrar',
                    loading_button_label: 'Entrando...',
                    link_text: 'Já tem uma conta? Entre aqui',
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Senha',
                    button_label: 'Criar conta',
                    loading_button_label: 'Criando conta...',
                    link_text: 'Não tem uma conta? Crie aqui',
                  },
                  forgotten_password: {
                    email_label: 'Email',
                    button_label: 'Enviar instruções',
                    loading_button_label: 'Enviando...',
                    link_text: 'Esqueceu sua senha?',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-slate-500 text-xs">
            Sistema seguro e confiável para gestão de cozinhas
          </p>
          <div className="flex justify-center items-center mt-2 space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Online</span>
            </div>
            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
            <span className="text-xs text-slate-500">v2.0</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container-custom {
          background: transparent !important;
        }
        
        .auth-button-custom {
          background: linear-gradient(135deg, #7c3aed, #a855f7) !important;
          border: none !important;
          font-weight: 600 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3) !important;
        }
        
        .auth-button-custom:hover {
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.5) !important;
        }
        
        .auth-input-custom {
          backdrop-filter: blur(10px) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .auth-input-custom:focus {
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1), 0 0 20px rgba(124, 58, 237, 0.2) !important;
        }
        
        .auth-label-custom {
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-container">
        <div className="loading-spinner"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}