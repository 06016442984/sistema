"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface ProjectReportsProps {
  projects: Project[];
  dateRange: { start: string; end: string };
}

interface ProjectStats {
  project_id: string;
  project_name: string;
  kitchen_name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  created_date: string;
}

export function ProjectReports({ projects, dateRange }: ProjectReportsProps) {
  const [stats, setStats] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectStats();
  }, [projects, dateRange]);

  const loadProjectStats = async () => {
    try {
      setLoading(true);

      const projectStats = await Promise.all(
        projects.map(async (project) => {
          // Carregar tarefas do projeto
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, status, prazo')
            .eq('project_id', project.id)
            .gte('criado_em', `${dateRange.start}T00:00:00`)
            .lte('criado_em', `${dateRange.end}T23:59:59`);

          const totalTasks = tasks?.length || 0;
          const completedTasks = tasks?.filter(t => t.status === 'CONCLUIDA').length || 0;
          const inProgressTasks = tasks?.filter(t => t.status === 'EM_ANDAMENTO').length || 0;
          const overdueTasks = tasks?.filter(t => 
            t.prazo && new Date(t.prazo) < new Date() && t.status !== 'CONCLUIDA'
          ).length || 0;

          const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          return {
            project_id: project.id,
            project_name: project.nome,
            kitchen_name: project.kitchens?.nome || 'N/A',
            status: project.status,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            in_progress_tasks: inProgressTasks,
            overdue_tasks: overdueTasks,
            completion_rate: Math.round(completionRate),
            created_date: project.criado_em,
          };
        })
      );

      setStats(projectStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas dos projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = stats.reduce(
    (acc, stat) => ({
      total_projects: acc.total_projects + 1,
      active_projects: acc.active_projects + (stat.status === 'ATIVO' ? 1 : 0),
      total_tasks: acc.total_tasks + stat.total_tasks,
      completed_tasks: acc.completed_tasks + stat.completed_tasks,
      overdue_tasks: acc.overdue_tasks + stat.overdue_tasks,
    }),
    { total_projects: 0, active_projects: 0, total_tasks: 0, completed_tasks: 0, overdue_tasks: 0 }
  );

  const overallCompletionRate = totalStats.total_tasks > 0 
    ? Math.round((totalStats.completed_tasks / totalStats.total_tasks) * 100)
    : 0;

  const chartData = stats.map(stat => ({
    name: stat.project_name.length > 15 ? stat.project_name.substring(0, 15) + '...' : stat.project_name,
    tarefas: stat.total_tasks,
    concluidas: stat.completed_tasks,
    atrasadas: stat.overdue_tasks,
    taxa: stat.completion_rate,
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'PAUSADO':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>;
      case 'CONCLUIDO':
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {totalStats.total_projects}
            </div>
            <div className="text-sm text-muted-foreground">Total de Projetos</div>
            <div className="text-xs text-green-600">
              {totalStats.active_projects} ativos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {totalStats.total_tasks}
            </div>
            <div className="text-sm text-muted-foreground">Total de Tarefas</div>
            <div className="text-xs text-blue-600">
              {totalStats.completed_tasks} concluídas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {overallCompletionRate}%
            </div>
            <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
            <Progress value={overallCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {totalStats.overdue_tasks}
            </div>
            <div className="text-sm text-muted-foreground">Tarefas Atrasadas</div>
            <div className="text-xs text-orange-600">
              Requer atenção
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Projetos</CardTitle>
          <CardDescription>
            Comparação de tarefas e taxa de conclusão por projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tarefas" fill="#8884d8" name="Total de Tarefas" />
              <Bar dataKey="concluidas" fill="#82ca9d" name="Concluídas" />
              <Bar dataKey="atrasadas" fill="#ff7c7c" name="Atrasadas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista Detalhada de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Projetos</CardTitle>
          <CardDescription>
            Estatísticas detalhadas de cada projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.project_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{stat.project_name}</h4>
                    <p className="text-sm text-muted-foreground">{stat.kitchen_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(stat.status)}
                    <Badge variant={stat.completion_rate >= 80 ? "default" : "secondary"}>
                      {stat.completion_rate}% conclusão
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-muted-foreground">Total de Tarefas</div>
                    <div className="font-medium">{stat.total_tasks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Concluídas</div>
                    <div className="font-medium text-green-600">{stat.completed_tasks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Em Andamento</div>
                    <div className="font-medium text-blue-600">{stat.in_progress_tasks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Atrasadas</div>
                    <div className="font-medium text-red-600">{stat.overdue_tasks}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Progress value={stat.completion_rate} className="flex-1 mr-4" />
                  <span className="text-xs text-muted-foreground">
                    Criado em {formatDate(stat.created_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}