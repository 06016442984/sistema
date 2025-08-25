"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  FolderOpen,
  GitBranch,
  Users,
  Shield,
  User,
  FileText,
  Bell
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kanban',
    href: '/kanban',
    icon: KanbanSquare,
  },
  {
    title: 'Projetos',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Árvore',
    href: '/tree',
    icon: GitBranch,
  },
  {
    title: 'Usuários',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Permissões',
    href: '/permissions',
    icon: Shield,
  },
  {
    title: 'Perfil',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Auditoria',
    href: '/audit',
    icon: FileText,
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
    submenu: [
      {
        title: 'Lembretes',
        href: '/settings/reminders',
        icon: Bell,
      },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isExpanded = (href: string) => expandedItems.includes(href);

  return (
    <div className={cn(
      "flex flex-col h-screen glass-card border-r border-glass-border transition-all duration-300 fixed left-0 top-0 z-30",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 lg:p-4 border-b border-glass-border min-h-[56px] lg:min-h-[64px]">
        {!collapsed && (
          <h1 className="text-lg lg:text-xl font-bold text-text-primary truncate">
            Dashboard
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 lg:px-3 py-3 lg:py-4">
        <nav className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const expanded = isExpanded(item.href);
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <div className="flex">
                    {/* Link principal para /settings */}
                    <Link href={item.href} className="flex-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-9 lg:h-10 text-sm lg:text-base",
                          active && "bg-primary/10 text-primary hover:bg-primary/20",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 lg:h-5 lg:w-5", !collapsed && "mr-2 lg:mr-3")} />
                        {!collapsed && <span className="flex-1 text-left truncate">{item.title}</span>}
                      </Button>
                    </Link>
                    
                    {/* Botão separado para expandir submenu (apenas quando não colapsado) */}
                    {!collapsed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(item.href)}
                        className="h-9 lg:h-10 w-8 p-0 ml-1 shrink-0"
                      >
                        <ChevronRight className={cn(
                          "h-3 w-3 lg:h-4 lg:w-4 transition-transform",
                          expanded && "rotate-90"
                        )} />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-9 lg:h-10 text-sm lg:text-base",
                        active && "bg-primary/10 text-primary hover:bg-primary/20",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 lg:h-5 lg:w-5", !collapsed && "mr-2 lg:mr-3")} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Button>
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && expanded && !collapsed && (
                  <div className="ml-3 lg:ml-4 mt-1 lg:mt-2 space-y-1">
                    {item.submenu?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = isActive(subItem.href);

                      return (
                        <Link key={subItem.href} href={subItem.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start h-8 text-xs lg:text-sm",
                              subActive && "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                          >
                            <SubIcon className="h-3 w-3 mr-2" />
                            <span className="truncate">{subItem.title}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}