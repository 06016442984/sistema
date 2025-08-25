"use client";

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Calendar, Users, FolderOpen, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  kitchen_id: string;
  nome: string;
  descricao: string | null;
  status: 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
  inicio_previsto: string | null;
  fim_previsto: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  kitchens?: {
    nome: string;
    codigo: string;
  };
  profiles?: {
    nome: string;
  };
  task_count?: number;
}

interface Kitchen {
  id: string;
  nome: string;
  codigo: string;
}

export default function ProjectsPage() {
  const { userRoles } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKitchen, setSelectedKitchen] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando projetos...');

      // Carregar unidades
      const { data: kitchensData, error: kitchensError } = await supabase
        .from('kitchens')
        .select('id, nome, codigo')
        .eq('ativo', true)
        .order('nome');

      if (kitchensError) {
        console.error('Erro ao carregar unidades:', kitchensError);
        throw kitchensError;
      }

      setKitchens(kitchensData || []);

      // Carregar projetos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          kitchens(nome, codigo),
          profiles(nome)
        `)
        .order('criado_em', { ascending: false });

      if (projectsError) {
        console.error('Erro ao carregar projetos:', projectsError);
        throw projectsError;
      }

      // Carregar contagem de tarefas para cada projeto
      const projectsWithTaskCount = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          return {
            ...project,
            task_count: count || 0
          };
        })
      );

      setProjects(projectsWithTaskCount);
      console.log('Projetos carregados:', projectsWithTaskCount.length);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ATIVO': 'Ativo',
      'PAUSADO': 'Pausado',
      'CONCLUIDO': 'Concluído',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ATIVO': 'bg-green-100 text-green-800',
      'PAUSADO': 'bg-yellow-100 text-yellow-800',
      'CONCLUIDO': 'bg-blue-100 text-blue-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKitchen = selectedKitchen === 'all' || project.kitchen_id === selectedKitchen;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesKitchen && matchesStatus;
  });

  const projectStats = {
    total: projects.length,
    ativo: projects.filter(p => p.status === 'ATIVO').length,
    pausado: projects.filter(p => p.status === 'PAUSADO').length,
    concluido: projects.filter(p => p.status === 'CONCLUIDO').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projetos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie todos os projetos da organização
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{projectStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">{projectStats.ativo}</div>
                <div className="text-sm text-muted-foreground">Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">{projectStats.pausado}</div>
                <div className="text-sm text-muted-foreground">Pausados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">{projectStats.concluido}</div>
                <div className="text-sm text-muted-foreground">Concluídos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Unidade */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade</label>
              <Select value={selectedKitchen} onValueChange={setSelectedKitchen}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {kitchens.map((kitchen) => (
                    <SelectItem key={kitchen.id} value={kitchen.id}>
                      {kitchen.nome} ({kitchen.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="PAUSADO">Pausado</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
          <CardDescription>
            Mostrando {filteredProjects.length} de {projects.length} projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Carregando projetos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum projeto encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Não há projetos que correspondam aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.nome}</div>
                          {project.descricao && (
                            <div className="text-sm text-muted-foreground">
                              {project.descricao.length > 50 
                                ? `${project.descricao.substring(0, 50)}...`
                                : project.descricao
                              }
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.kitchens ? (
                          <div>
                            <div className="font-medium">{project.kitchens.nome}</div>
                            <div className="text-sm text-muted-foreground">{project.kitchens.codigo}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.task_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.profiles?.nome || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        {formatDate(project.criado_em)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}