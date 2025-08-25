"use client";

import { useAuth } from '@/components/providers/auth-provider';
import { MainLayout } from './main-layout';
import { usePathname } from 'next/navigation';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Páginas que não precisam de layout (login, etc)
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.includes(pathname);

  // Se é página pública, renderizar sem layout
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, renderizar sem layout (AuthProvider vai redirecionar)
  if (!user) {
    return <>{children}</>;
  }

  // Se está autenticado, usar o layout principal
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}