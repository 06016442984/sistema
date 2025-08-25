"use client";

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileSidebar } from './mobile-sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Páginas que não precisam de autenticação
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Se estiver carregando, mostrar loading com fundo escuro
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se for rota pública, renderizar sem layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se não estiver autenticado em rota privada, mostrar loading com fundo escuro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary text-lg">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Renderizar layout autenticado com responsividade otimizada
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="lg:pl-64">
        <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
            <div className="space-y-4 lg:space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}