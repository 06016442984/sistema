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
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-900">
            Dashboard
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
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
                          "w-full justify-start h-10",
                          active && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                        {!collapsed && <span className="flex-1 text-left">{item.title}</span>}
                      </Button>
                    </Link>
                    
                    {/* Botão separado para expandir submenu (apenas quando não colapsado) */}
                    {!collapsed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(item.href)}
                        className="h-10 w-8 p-0 ml-1"
                      >
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
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
                        "w-full justify-start h-10",
                        active && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                      {!collapsed && <span>{item.title}</span>}
                    </Button>
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && expanded && !collapsed && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.submenu?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = isActive(subItem.href);

                      return (
                        <Link key={subItem.href} href={subItem.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start h-8 text-sm",
                              subActive && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            )}
                          >
                            <SubIcon className="h-3 w-3 mr-2" />
                            <span>{subItem.title}</span>
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