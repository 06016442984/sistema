"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Download, 
  Filter, 
  Calendar,
  Users,
  FolderOpen,
  CheckSquare,
  ChefHat,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  projects: any[];
  tasks: any[];
  users: any[];
  kitchens: any[];
  activities: any[];
  reminders: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ReportsPage() {
  const { userRoles } = useAuth();
  const [data, setData] = useState<ReportData>({
    projects: [],
    tasks: [],
    users: [],
    kitchens: [],
    activities: [],
    reminders: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    kitchenId: 'all',
    status: 'all',
    userId: 'all'
  });

  // Memoizar kitchenIds para evitar recálculo desnecessário
  const kitchenIds = useMemo(() => {
    return userRoles?.map(role => role.kitchen_id) || [];
  }, [userRoles]);

  const loadReportData = async () => {
    if (kitchenIds.length === 0) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando dados dos relatórios...');

      // Carregar projetos
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          kitchens(nome, codigo),
          profiles!projects_criado_por_fkey(nome)
        `)
        .in('kitchen_id', kitchenIds);

      // Carregar tarefas
      const projectIds = projects?.map(p => p.id) || [];
      const { data: tasks } = projectIds.length > 0 ? await supabase
        .from('tasks')
        .select(`
          *,
          projects(nome, kitchen_id, kitchens(nome, codigo)),
          responsavel:profiles!tasks_responsavel_id_fkey(nome, email),
          criador:profiles!tasks_criado_por_fkey(nome)
        `)
        .in('project_id', projectIds) : { data: [] };

      // Carregar usuários
      const { data: users } = await supabase
        .from('user_kitchen_roles')
        .select(`
          *,
          profiles(nome, email, telefone, ativo),
          kitchens(nome, codigo)
        `)
        .in('kitchen_id', kitchenIds);

      // Carregar unidades
      const { data: kitchens } = await supabase
        .from('kitchens')
        .select('*')
        .in('id', kitchenIds);

      // Carregar atividades
      const { data: activities } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles(nome)
        `)
        .in('kitchen_id', kitchenIds)
        .order('criado_em', { ascending: false })
        .limit(100);

      // Carregar lembretes
      const { data: reminders } = await supabase
        .from('task_reminders')
        .select(`
          *,
          tasks(titulo, projects(nome, kitchens(nome))),
          profiles(nome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      setData({
        projects: projects || [],
        tasks: tasks || [],
        users: users || [],
        kitchens: kitchens || [],
        activities: activities || [],
        reminders: reminders || []
      });

      console.log('✅ Dados dos relatórios carregados');
    } catch (error) {
      console.error('💥 Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect com dependências corretas
  useEffect(() => {
    if (kitchenIds.length > 0) {
      loadReportData();
    }
  }, [kitchenIds.length]); // Dependência estável

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Estatísticas gerais
  const stats = useMemo(() => ({
    totalProjects: data.projects.length,
    activeProjects: data.projects.filter(p => p.status === 'ATIVO').length,
    totalTasks: data.tasks.length,
    completedTasks: data.tasks.filter(t => t.status === 'CONCLUIDA').length,
    pendingTasks: data.tasks.filter(t => t.status !== 'CONCLUIDA').length,
    totalUsers: data.users.length,
    activeUsers: data.users.filter(u => u.profiles?.ativo).length,
    totalKitchens: data.kitchens.length,
    activeKitchens: data.kitchens.filter(k => k.ativo).length
  }), [data]);

  // Dados para gráficos
  const chartData = useMemo(() => ({
    projectsByStatus: [
      { name: 'Ativo', value: data.projects.filter(p => p.status === 'ATIVO').length },
      { name: 'Pausado', value: data.projects.filter(p => p.status === 'PAUSADO').length },
      { name: 'Concluído', value: data.projects.filter(p => p.status === 'CONCLUIDO').length }
    ],
    tasksByStatus: [
      { name: 'Backlog', value: data.tasks.filter(t => t.status === 'BACKLOG').length },
      { name: 'Em Progresso', value: data.tasks.filter(t => t.status === 'EM_PROGRESSO').length },
      { name: 'Em Revisão', value: data.tasks.filter(t => t.status === 'EM_REVISAO').length },
      { name: 'Concluída', value: data.tasks.filter(t => t.status === 'CONCLUIDA').length }
    ],
    tasksByPriority: [
      { name: 'Alta', value: data.tasks.filter(t => t.prioridade === 'ALTA').length },
      { name: 'Média', value: data.tasks.filter(t => t.prioridade === 'MEDIA').length },
      { name: 'Baixa', value: data.tasks.filter(t => t.prioridade === 'BAIXA').length }
    ]
  }), [data]);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2">Carregando relatórios...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Relatórios</h1>
            <p className="text-text-secondary">
              Análises detalhadas e estatísticas do sistema
            </p>
          </div>
          <Button onClick={() => window.print()} className="gap-2">
            <Download className="h-4 w-4" />
            Imprimir Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="kitchen">Unidade</Label>
                <Select value={filters.kitchenId} onValueChange={(value) => setFilters(prev => ({ ...prev, kitchenId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {data.kitchens.map(kitchen => (
                      <SelectItem key={kitchen.id} value={kitchen.id}>
                        {kitchen.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="PAUSADO">Pausado</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadReportData} className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalProjects}</p>
                  <p className="text-sm text-text-secondary">Total de Projetos</p>
                  <p className="text-xs text-green-600">{stats.activeProjects} ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalTasks}</p>
                  <p className="text-sm text-text-secondary">Total de Tarefas</p>
                  <p className="text-xs text-orange-600">{stats.pendingTasks} pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
                  <p className="text-sm text-text-secondary">Total de Usuários</p>
                  <p className="text-xs text-green-600">{stats.activeUsers} ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalKitchens}</p>
                  <p className="text-sm text-text-secondary">Total de Unidades</p>
                  <p className="text-xs text-green-600">{stats.activeKitchens} ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Relatórios */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="reminders">Lembretes</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Projetos por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData.projectsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {chartData.projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Tarefas por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData.tasksByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Tarefas por Prioridade</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData.tasksByPriority}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {chartData.tasksByPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projetos */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Relatório de Projetos</CardTitle>
                  <CardDescription>Lista detalhada de todos os projetos</CardDescription>
                </div>
                <Button 
                  onClick={() => exportToCSV(data.projects, 'projetos')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Unidade</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Criado por</th>
                        <th className="text-left p-2">Data Criação</th>
                        <th className="text-left p-2">Início Previsto</th>
                        <th className="text-left p-2">Fim Previsto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-glass-bg">
                          <td className="p-2 font-medium">{project.nome}</td>
                          <td className="p-2">{project.kitchens?.nome}</td>
                          <td className="p-2">
                            <Badge variant={project.status === 'ATIVO' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="p-2">{project.profiles?.nome}</td>
                          <td className="p-2">
                            {project.criado_em ? format(new Date(project.criado_em), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                          <td className="p-2">
                            {project.inicio_previsto ? format(new Date(project.inicio_previsto), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                          <td className="p-2">
                            {project.fim_previsto ? format(new Date(project.fim_previsto), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tarefas */}
          <TabsContent value="tasks" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Relatório de Tarefas</CardTitle>
                  <CardDescription>Lista detalhada de todas as tarefas</CardDescription>
                </div>
                <Button 
                  onClick={() => exportToCSV(data.tasks, 'tarefas')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Título</th>
                        <th className="text-left p-2">Projeto</th>
                        <th className="text-left p-2">Responsável</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Prioridade</th>
                        <th className="text-left p-2">Prazo</th>
                        <th className="text-left p-2">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tasks.map((task) => (
                        <tr key={task.id} className="border-b hover:bg-glass-bg">
                          <td className="p-2 font-medium">{task.titulo}</td>
                          <td className="p-2">{task.projects?.nome}</td>
                          <td className="p-2">{task.responsavel?.nome || 'Não atribuído'}</td>
                          <td className="p-2">
                            <Badge variant={task.status === 'CONCLUIDA' ? 'default' : 'secondary'}>
                              {task.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={
                              task.prioridade === 'ALTA' ? 'destructive' : 
                              task.prioridade === 'MEDIA' ? 'default' : 'secondary'
                            }>
                              {task.prioridade}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {task.prazo ? format(new Date(task.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                          <td className="p-2">
                            {task.criado_em ? format(new Date(task.criado_em), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="users" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Relatório de Usuários</CardTitle>
                  <CardDescription>Lista detalhada de todos os usuários</CardDescription>
                </div>
                <Button 
                  onClick={() => exportToCSV(data.users, 'usuarios')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Telefone</th>
                        <th className="text-left p-2">Unidade</th>
                        <th className="text-left p-2">Função</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Data Criação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-glass-bg">
                          <td className="p-2 font-medium">{user.profiles?.nome}</td>
                          <td className="p-2">{user.profiles?.email}</td>
                          <td className="p-2">{user.profiles?.telefone || '-'}</td>
                          <td className="p-2">{user.kitchens?.nome}</td>
                          <td className="p-2">
                            <Badge variant="outline">{user.role}</Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={user.profiles?.ativo ? 'default' : 'secondary'}>
                              {user.profiles?.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {user.criado_em ? format(new Date(user.criado_em), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atividades */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Relatório de Atividades</CardTitle>
                  <CardDescription>Log de atividades do sistema</CardDescription>
                </div>
                <Button 
                  onClick={() => exportToCSV(data.activities, 'atividades')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Usuário</th>
                        <th className="text-left p-2">Recurso</th>
                        <th className="text-left p-2">Ação</th>
                        <th className="text-left p-2">Data/Hora</th>
                        <th className="text-left p-2">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activities.map((activity) => (
                        <tr key={activity.id} className="border-b hover:bg-glass-bg">
                          <td className="p-2">{activity.profiles?.nome || 'Sistema'}</td>
                          <td className="p-2">{activity.recurso}</td>
                          <td className="p-2">
                            <Badge variant="outline">{activity.acao}</Badge>
                          </td>
                          <td className="p-2">
                            {activity.criado_em ? format(new Date(activity.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                          </td>
                          <td className="p-2 max-w-xs truncate">
                            {activity.payload ? JSON.stringify(activity.payload).substring(0, 100) + '...' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lembretes */}
          <TabsContent value="reminders" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Relatório de Lembretes</CardTitle>
                  <CardDescription>Histórico de lembretes enviados</CardDescription>
                </div>
                <Button 
                  onClick={() => exportToCSV(data.reminders, 'lembretes')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Usuário</th>
                        <th className="text-left p-2">Tarefa</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Agendado para</th>
                        <th className="text-left p-2">Enviado</th>
                        <th className="text-left p-2">Data Envio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reminders.map((reminder) => (
                        <tr key={reminder.id} className="border-b hover:bg-glass-bg">
                          <td className="p-2">{reminder.profiles?.nome}</td>
                          <td className="p-2">{reminder.tasks?.titulo}</td>
                          <td className="p-2">
                            <Badge variant="outline">{reminder.reminder_type}</Badge>
                          </td>
                          <td className="p-2">
                            {reminder.scheduled_time ? format(new Date(reminder.scheduled_time), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                          </td>
                          <td className="p-2">
                            <Badge variant={reminder.sent ? 'default' : 'secondary'}>
                              {reminder.sent ? 'Sim' : 'Não'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {reminder.sent_at ? format(new Date(reminder.sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}