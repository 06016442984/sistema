"use client";

import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-background-primary/95 backdrop-blur-sm border-b border-glass-border">
      <div className="flex h-14 lg:h-16 items-center justify-between px-3 sm:px-4 lg:px-8">
        
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-9 w-9 p-0"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>

        {/* Logo/Title - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-text-primary">
            Kitchen Manager
          </h1>
        </div>

        {/* Mobile Logo - Centered */}
        <div className="lg:hidden flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-text-primary">
            Kitchen Manager
          </h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 relative"
          >
            <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 lg:h-10 lg:w-10 p-0 rounded-full"
              >
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="sr-only">Menu do usuário</span>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48 lg:w-56">
              <DropdownMenuLabel className="text-sm">
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">Minha Conta</p>
                  <p className="text-xs text-text-secondary truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => router.push('/profile')}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => router.push('/settings')}
                className="cursor-pointer"
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}