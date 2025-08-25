"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, Users, ChefHat, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { Task, Project, Profile, Kitchen } from '@/types/database';

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'user' | 'kitchen';
  title: string;
  subtitle?: string;
  description?: string;
  data: any;
}

export function GlobalSearch() {
  const { user, userRoles } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 300),
    [user, userRoles]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'project':
        return <FolderOpen className="h-4 w-4 text-green-600" />;
      case 'user':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'kitchen':
        return <ChefHat className="h-4 w-4 text-orange-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Tarefa';
      case 'project':
        return 'Projeto';
      case 'user':
        return 'Usuário';
      case 'kitchen':
        return 'Cozinha';
      default:
        return 'Item';
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!user || userRoles.length === 0) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const kitchenIds = userRoles.map(role => role.kitchen_id);
      const searchResults: SearchResult[] = [];

      // Buscar tarefas
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(nome, kitchen_id)
        `)
        .in('projects.kitchen_id', kitchenIds)
        .or(`titulo.ilike.%${searchQuery}%,descricao.ilike.%${searchQuery}%`);

      if (tasks && Array.isArray(tasks)) {
        tasks.forEach((task: Task & { projects: any }) => {
          searchResults.push({
            id: task.id,
            type: 'task',
            title: task.titulo,
            subtitle: task.projects?.nome || 'Projeto',
            description: task.descricao,
            data: task
          });
        });
      }

      // Buscar projetos
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          kitchens(nome)
        `)
        .in('kitchen_id', kitchenIds)
        .or(`nome.ilike.%${searchQuery}%,descricao.ilike.%${searchQuery}%`);

      if (projects && Array.isArray(projects)) {
        projects.forEach((project: Project & { kitchens: any }) => {
          searchResults.push({
            id: project.id,
            type: 'project',
            title: project.nome,
            subtitle: project.kitchens?.nome || 'Cozinha',
            description: project.descricao,
            data: project
          });
        });
      }

      // Buscar usuários
      const { data: users } = await supabase
        .from('user_kitchen_roles')
        .select(`
          profiles(id, nome, email),
          kitchens(nome)
        `)
        .in('kitchen_id', kitchenIds);

      if (users && Array.isArray(users)) {
        const filteredUsers = users.filter((userRole: any) => {
          const profile = userRole.profiles;
          if (!profile) return false;
          
          const nameMatch = profile.nome?.toLowerCase().includes(searchQuery.toLowerCase());
          const emailMatch = profile.email?.toLowerCase().includes(searchQuery.toLowerCase());
          return nameMatch || emailMatch;
        });

        filteredUsers.forEach((userRole: any) => {
          const profile = userRole.profiles;
          const kitchen = userRole.kitchens;
          
          if (profile) {
            searchResults.push({
              id: profile.id,
              type: 'user',
              title: profile.nome || 'Usuário',
              subtitle: kitchen?.nome || 'Cozinha',
              description: profile.email,
              data: profile
            });
          }
        });
      }

      // Buscar cozinhas
      const { data: kitchens } = await supabase
        .from('kitchens')
        .select('*')
        .in('id', kitchenIds)
        .or(`nome.ilike.%${searchQuery}%,codigo.ilike.%${searchQuery}%`);

      if (kitchens && Array.isArray(kitchens)) {
        kitchens.forEach((kitchen: Kitchen) => {
          searchResults.push({
            id: kitchen.id,
            type: 'kitchen',
            title: kitchen.nome,
            subtitle: `Código: ${kitchen.codigo}`,
            description: kitchen.endereco,
            data: kitchen
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Aqui você pode implementar a navegação para o item selecionado
    console.log('Resultado selecionado:', result);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar tarefas, projetos, usuários..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : results.length > 0 ? (
              <ScrollArea className="max-h-96">
                <div className="p-2">
                  {results.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      {getSearchIcon(result.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {result.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : query ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Também exportar como default para compatibilidade
export default GlobalSearch;