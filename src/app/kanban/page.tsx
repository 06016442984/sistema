"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { KanbanFilters } from '@/components/kanban/kanban-filters';
import { TaskDialog } from '@/components/kanban/task-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Filter, 
  X, 
  Building,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  CheckSquare,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TaskStatus, TaskPriority, Profile, Kitchen, Project } from '@/types/database';
import { MainLayout } from '@/components/layout/main-layout';

interface Task {
  id: string;
  titulo: string;
  descricao: string;
  status: TaskStatus;
  prioridade: TaskPriority;
  prazo: string;
  responsavel_id: string;
  project_id: string;
  criado_em: string;
  responsavel_nome?: string;
  responsavel_email?: string;
  projeto_nome?: string;
  unidade_nome?: string;
  unidade_codigo?: string;
  kitchen_id?: string;
}

interface KanbanFilters {
  status: TaskStatus[];
  priority: TaskPriority[];
  responsavel_id: string[];
  kitchen_id: string[];
  prazo_inicio: string;
  prazo_fim: string;
  minhas_tarefas: boolean;
}

export default function KanbanPage() {
  const { user, userRoles } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Estados do dialog de tarefa
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Estados do dialog de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [filters, setFilters] = useState<KanbanFilters>({
    status: [],
    priority: [],
    responsavel_id: [],
    kitchen_id: [],
    prazo_inicio: '',
    prazo_fim: '',
    minhas_tarefas: false,
  });

  const statusColumns = [
    { 
      id: 'BACKLOG', 
      title: 'Backlog', 
      color: 'bg-gray-600',
      icon: AlertCircle
    },
    { 
      id: 'EM_ANDAMENTO', 
      title: 'Em Andamento', 
      color: 'bg-blue-600',
      icon: Clock
    },
    { 
      id: 'EM_REVISAO', 
      title: 'Em Revisão', 
      color: 'bg-yellow-600',
      icon: AlertCircle
    },
    { 
      id: 'CONCLUIDA', 
      title: 'Concluída', 
      color: 'bg-green-600',
      icon: CheckCircle
    },
  ];

  useEffect(() => {
    if (userRoles.length > 0) {
      loadData();
    }
  }, [userRoles]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do Kanban...');

      // Obter IDs das unidades que o usuário tem acesso
      const kitchenIds = userRoles.map(role => role.kitchen_id);

      if (kitchenIds.length === 0) {
        console.log('⚠️ Usuário não tem acesso a nenhuma unidade');
        setTasks([]);
        setFilteredTasks([]);
        setKitchens([]);
        setUsers([]);
        setProjects([]);
        return;
      }

      console.log('🏢 Unidades do usuário:', kitchenIds);

      // 1. Carregar unidades ativas
      const { data: kitchensData, error: kitchensError } = await supabase
        .from('kitchens')
        .select('id, nome, codigo, ativo')
        .in('id', kitchenIds)
        .eq('ativo', true)
        .order('nome');

      if (kitchensError) {
        console.error('❌ Erro ao carregar unidades:', kitchensError);
        throw new Error(`Erro ao carregar unidades: ${kitchensError.message}`);
      }

      console.log('✅ Unidades carregadas:', kitchensData?.length || 0);
      setKitchens(kitchensData || []);

      if (!kitchensData || kitchensData.length === 0) {
        console.log('⚠️ Nenhuma unidade ativa encontrada');
        setTasks([]);
        setFilteredTasks([]);
        setUsers([]);
        setProjects([]);
        return;
      }

      // 2. Carregar projetos das unidades ativas
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, nome, kitchen_id, status')
        .in('kitchen_id', kitchensData.map(k => k.id))
        .eq('status', 'ATIVO')
        .order('nome');

      if (projectsError) {
        console.error('❌ Erro ao carregar projetos:', projectsError);
        throw new Error(`Erro ao carregar projetos: ${projectsError.message}`);
      }

      console.log('✅ Projetos carregados:', projectsData?.length || 0);
      setProjects(projectsData || []);

      if (!projectsData || projectsData.length === 0) {
        console.log('⚠️ Nenhum projeto ativo encontrado');
        setTasks([]);
        setFilteredTasks([]);
        setUsers([]);
        return;
      }

      const projectIds = projectsData.map(p => p.id);

      // 3. Carregar tarefas dos projetos
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, titulo, descricao, status, prioridade, prazo, responsavel_id, project_id, criado_em')
        .in('project_id', projectIds)
        .order('criado_em', { ascending: false });

      if (tasksError) {
        console.error('❌ Erro ao carregar tarefas:', tasksError);
        throw new Error(`Erro ao carregar tarefas: ${tasksError.message}`);
      }

      console.log('✅ Tarefas carregadas:', tasksData?.length || 0);

      // 4. Carregar responsáveis das tarefas
      const responsavelIds = [...new Set(tasksData?.map(t => t.responsavel_id).filter(Boolean) || [])];
      let responsaveis: any[] = [];

      if (responsavelIds.length > 0) {
        const { data: responsaveisData, error: responsaveisError } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', responsavelIds);

        if (responsaveisError) {
          console.error('❌ Erro ao carregar responsáveis:', responsaveisError);
        } else {
          responsaveis = responsaveisData || [];
          console.log('✅ Responsáveis carregados:', responsaveis.length);
        }
      }

      // 5. Montar dados das tarefas com relacionamentos
      const tasksWithRelations: Task[] = (tasksData || []).map(task => {
        const projeto = projectsData.find(p => p.id === task.project_id);
        const unidade = kitchensData.find(k => k.id === projeto?.kitchen_id);
        const responsavel = responsaveis.find(r => r.id === task.responsavel_id);

        return {
          ...task,
          responsavel_nome: responsavel?.nome,
          responsavel_email: responsavel?.email,
          projeto_nome: projeto?.nome,
          unidade_nome: unidade?.nome,
          unidade_codigo: unidade?.codigo,
          kitchen_id: projeto?.kitchen_id
        };
      });

      console.log('✅ Tarefas com relacionamentos montadas:', tasksWithRelations.length);
      setTasks(tasksWithRelations);

      // 6. Carregar todos os usuários únicos para os filtros
      setUsers(responsaveis);

    } catch (error: any) {
      console.error('💥 Erro detalhado no Kanban:', error);
      toast.error(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
      
      // Limpar estados em caso de erro
      setTasks([]);
      setFilteredTasks([]);
      setKitchens([]);
      setUsers([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filtro por status
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    // Filtro por prioridade
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.prioridade));
    }

    // Filtro por responsável
    if (filters.responsavel_id.length > 0) {
      filtered = filtered.filter(task => 
        task.responsavel_id && filters.responsavel_id.includes(task.responsavel_id)
      );
    }

    // Filtro por unidade
    if (filters.kitchen_id.length > 0) {
      filtered = filtered.filter(task => 
        task.kitchen_id && filters.kitchen_id.includes(task.kitchen_id)
      );
    }

    // Filtro por prazo
    if (filters.prazo_inicio) {
      filtered = filtered.filter(task => 
        task.prazo && task.prazo >= filters.prazo_inicio
      );
    }

    if (filters.prazo_fim) {
      filtered = filtered.filter(task => 
        task.prazo && task.prazo <= filters.prazo_fim
      );
    }

    // Filtro "minhas tarefas"
    if (filters.minhas_tarefas && user?.id) {
      filtered = filtered.filter(task => task.responsavel_id === user.id);
    }

    setFilteredTasks(filtered);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'ALTA': return 'bg-red-500';
      case 'MEDIA': return 'bg-yellow-500';
      case 'BAIXA': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'ALTA': return 'Alta';
      case 'MEDIA': return 'Média';
      case 'BAIXA': return 'Baixa';
      default: return 'Indefinida';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (prazo: string) => {
    if (!prazo) return false;
    return new Date(prazo) < new Date();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.responsavel_id.length > 0) count++;
    if (filters.kitchen_id.length > 0) count++;
    if (filters.prazo_inicio) count++;
    if (filters.prazo_fim) count++;
    if (filters.minhas_tarefas) count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      responsavel_id: [],
      kitchen_id: [],
      prazo_inicio: '',
      prazo_fim: '',
      minhas_tarefas: false,
    });
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;

      toast.success('Tarefa excluída com sucesso!');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      loadData();

    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskSaved = () => {
    setTaskDialogOpen(false);
    loadData();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2">Carregando Kanban...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Kanban</h1>
            <p className="text-text-secondary">
              Gerencie suas tarefas de forma visual
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateTask}
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary text-white">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
            
            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="filters-section">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Filtros Avançados</h3>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="bg-primary text-white">
                    {getActiveFiltersCount()} ativo(s)
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {getActiveFiltersCount() > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="bg-glass-bg border-glass-border text-text-primary hover:bg-red-500/20"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <KanbanFilters
              filters={filters}
              onFiltersChange={setFilters}
              users={users}
              kitchens={kitchens}
            />
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusColumns.map((column) => {
            const tasksCount = getTasksByStatus(column.id as TaskStatus).length;
            const Icon = column.icon;
            
            return (
              <div key={column.id} className="stat-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">{column.title}</p>
                      <p className="text-2xl font-bold text-text-primary">{tasksCount}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${column.color}/20`}>
                      <Icon className={`h-5 w-5 text-white`} />
                    </div>
                  </div>
                </CardContent>
              </div>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id as TaskStatus);
            
            return (
              <div key={column.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                    <h3 className="font-semibold text-text-primary">{column.title}</h3>
                    <Badge variant="secondary" className="bg-glass-bg text-text-secondary">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-glass-bg border border-glass-border rounded-lg p-3 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 
                          className="font-medium text-text-primary text-sm line-clamp-2 flex-1 cursor-pointer"
                          onClick={() => handleEditTask(task)}
                        >
                          {task.titulo}
                        </h4>
                        <div className="flex items-center gap-1 ml-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.prioridade)}`}></div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background-secondary border-glass-border">
                              <DropdownMenuItem 
                                onClick={() => handleEditTask(task)}
                                className="text-text-secondary hover:bg-glass-bg cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTask(task)}
                                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {task.descricao && (
                        <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                          {task.descricao}
                        </p>
                      )}

                      <div className="space-y-2">
                        {/* Projeto e Unidade */}
                        <div className="flex items-center gap-2 text-xs">
                          <Building className="h-3 w-3 text-primary" />
                          <span className="text-text-secondary truncate">
                            {task.unidade_nome} - {task.projeto_nome}
                          </span>
                        </div>

                        {/* Responsável */}
                        {task.responsavel_nome && (
                          <div className="flex items-center gap-2 text-xs">
                            <User className="h-3 w-3 text-secondary" />
                            <span className="text-text-secondary truncate">
                              {task.responsavel_nome}
                            </span>
                          </div>
                        )}

                        {/* Prazo */}
                        {task.prazo && (
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-3 w-3 text-accent" />
                            <span className={`${isOverdue(task.prazo) ? 'text-red-400' : 'text-text-secondary'}`}>
                              {formatDate(task.prazo)}
                              {isOverdue(task.prazo) && ' (Atrasado)'}
                            </span>
                          </div>
                        )}

                        {/* Prioridade */}
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(task.prioridade)} text-white border-0`}
                          >
                            {getPriorityLabel(task.prioridade)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado vazio */}
        {filteredTasks.length === 0 && tasks.length > 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-text-secondary mb-4">
              Ajuste os filtros para ver mais tarefas
            </p>
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
            >
              Limpar Filtros
            </Button>
          </div>
        )}

        {tasks.length === 0 && !loading && (
          <div className="text-center py-8">
            <CheckSquare className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-text-secondary mb-4">
              {kitchens.length === 0 ? 
                'Você não tem acesso a nenhuma unidade ativa.' :
                'Crie projetos e tarefas para começar a usar o Kanban.'
              }
            </p>
            {kitchens.length === 0 ? (
              <Button 
                variant="outline" 
                onClick={loadData}
                className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Novamente
              </Button>
            ) : (
              <Button 
                onClick={handleCreateTask}
                className="bg-primary hover:bg-primary/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tarefa
              </Button>
            )}
          </div>
        )}

        {/* Dialog de Tarefa */}
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={editingTask}
          projects={projects}
          users={users}
          onSaved={handleTaskSaved}
        />

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-background-secondary border-glass-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-text-primary">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-text-secondary">
                Tem certeza que deseja excluir a tarefa "{taskToDelete?.titulo}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                className="bg-glass-bg border-glass-border text-text-primary hover:bg-glass-bg/80"
                disabled={deleting}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteTask}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Excluindo...
                  </div>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}