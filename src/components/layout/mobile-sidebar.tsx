"use client";

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  X,
  LayoutDashboard, 
  KanbanSquare, 
  Settings,
  FolderOpen,
  GitBranch,
  Users,
  Shield,
  User,
  FileText,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Projetos', href: '/projects', icon: FolderOpen },
  { name: 'Árvore', href: '/tree', icon: GitBranch },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Permissões', href: '/permissions', icon: Shield },
  { name: 'Perfil', href: '/profile', icon: User },
  { name: 'Auditoria', href: '/audit', icon: FileText },
];

const settingsNavigation = [
  { name: 'Configurações', href: '/settings', icon: Settings },
  { name: 'Lembretes', href: '/settings/reminders', icon: Bell },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 rounded-md"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar sidebar</span>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background-primary/95 backdrop-blur-xl px-4 pb-4 border-r border-glass-border">
                
                {/* Header */}
                <div className="flex h-16 shrink-0 items-center border-b border-glass-border">
                  <h1 className="text-xl font-bold text-text-primary">
                    Kitchen Manager
                  </h1>
                </div>
                
                {/* User Info */}
                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-glass-bg border border-glass-border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}
                
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    
                    {/* Main Navigation */}
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                  'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200',
                                  active
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-bg border border-transparent'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    'h-5 w-5 shrink-0',
                                    active
                                      ? 'text-primary'
                                      : 'text-text-muted group-hover:text-text-primary'
                                  )}
                                />
                                {item.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>

                    {/* Settings Section */}
                    <li>
                      <div className="text-xs font-semibold leading-6 text-text-muted flex items-center gap-2 mb-2">
                        <Settings className="h-3 w-3" />
                        Configurações
                      </div>
                      <ul role="list" className="-mx-2 space-y-1">
                        {settingsNavigation.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                  'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200',
                                  active
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-bg border border-transparent'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    'h-5 w-5 shrink-0',
                                    active
                                      ? 'text-primary'
                                      : 'text-text-muted group-hover:text-text-primary'
                                  )}
                                />
                                {item.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}