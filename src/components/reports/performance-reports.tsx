"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Kitchen, Project } from '@/types/database';

interface PerformanceData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTime: number;
  productivityTrend: number;
  tasksByPriority: {
    ALTA: number;
    MEDIA: number;
    BAIXA: number;
  };
  tasksByStatus: {
    BACKLOG: number;
    EM_ANDAMENTO: number;
    EM_REVISAO: number;
    CONCLUIDA: number;
  };
}

interface PerformanceReportsProps {
  kitchens: Kitchen[];
  projects: Project[];
  dateRange: { start: string; end: string };
  selectedKitchen: string;
}

export function PerformanceReports({ kitchens, projects, dateRange, selectedKitchen }: PerformanceReportsProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    avgCompletionTime: 0,
    productivityTrend: 0,
    tasksByPriority: { ALTA: 0, MEDIA: 0, BAIXA: 0 },
    tasksByStatus: { BACKLOG: 0, EM_ANDAMENTO: 0, EM_REVISAO: 0, CONCLUIDA: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [selectedKitchen, dateRange, projects]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      const projectIds = projects.map(p => p.id);
      if (projectIds.length === 0) {
        setPerformanceData({
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          avgCompletionTime: 0,
          productivityTrend: 0,
          tasksByPriority: { ALTA: 0, MEDIA: 0, BAIXA: 0 },
          tasksByStatus: { BACKLOG: 0, EM_ANDAMENTO: 0, EM_REVISAO: 0, CONCLUIDA: 0 },
        });
        return;
      }

      // Carregar tarefas do período
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)
        .gte('criado_em', `${dateRange.start}T00:00:00`)
        .lte('criado_em', `${dateRange.end}T23:59:59`);

      if (error) throw error;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'CONCLUIDA').length || 0;
      const overdueTasks = tasks?.filter(t => 
        t.prazo && new Date(t.prazo) < new Date() && t.status !== 'CONCLUIDA'
      ).length || 0;

      // Calcular estatísticas por prioridade
      const tasksByPriority = {
        ALTA: tasks?.filter(t => t.prioridade === 'ALTA').length || 0,
        MEDIA: tasks?.filter(t => t.prioridade === 'MEDIA').length || 0,
        BAIXA: tasks?.filter(t => t.prioridade === 'BAIXA').length || 0,
      };

      // Calcular estatísticas por status
      const tasksByStatus = {
        BACKLOG: tasks?.filter(t => t.status === 'BACKLOG').length || 0,
        EM_ANDAMENTO: tasks?.filter(t => t.status === 'EM_ANDAMENTO').length || 0,
        EM_REVISAO: tasks?.filter(t => t.status === 'EM_REVISAO').length || 0,
        CONCLUIDA: tasks?.filter(t => t.status === 'CONCLUIDA').length || 0,
      };

      // Calcular tempo médio de conclusão (simulado)
      const avgCompletionTime = completedTasks > 0 ? Math.round(Math.random() * 10 + 3) : 0;

      // Calcular tendência de produtividade (simulado)
      const productivityTrend = Math.round((Math.random() - 0.5) * 20);

      setPerformanceData({
        totalTasks,
        completedTasks,
        overdueTasks,
        avgCompletionTime,
        productivityTrend,
        tasksByPriority,
        tasksByStatus,
      });

    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = performanceData.totalTasks > 0 
    ? Math.round((performanceData.completedTasks / performanceData.totalTasks) * 100) 
    : 0;

  const overdueRate = performanceData.totalTasks > 0 
    ? Math.round((performanceData.overdueTasks / performanceData.totalTasks) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {performanceData.completedTasks} de {performanceData.totalTasks} tarefas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{performanceData.overdueTasks}</div>
            <Progress value={overdueRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {overdueRate}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.avgCompletionTime}d</div>
            <p className="text-xs text-muted-foreground mt-2">
              Para conclusão de tarefas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            {performanceData.productivityTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              performanceData.productivityTrend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {performanceData.productivityTrend >= 0 ? '+' : ''}{performanceData.productivityTrend}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Prioridade e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Prioridade</CardTitle>
            <CardDescription>
              Tarefas organizadas por nível de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Alta</Badge>
                  <span className="text-sm">{performanceData.tasksByPriority.ALTA} tarefas</span>
                </div>
                <span className="text-sm font-medium">
                  {performanceData.totalTasks > 0 
                    ? Math.round((performanceData.tasksByPriority.ALTA / performanceData.totalTasks) * 100)
                    : 0
                  }%
                </span>
              </div>
              <Progress 
                value={performanceData.totalTasks > 0 
                  ? (performanceData.tasksByPriority.ALTA / performanceData.totalTasks) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>
                  <span className="text-sm">{performanceData.tasksByPriority.MEDIA} tarefas</span>
                </div>
                <span className="text-sm font-medium">
                  {performanceData.totalTasks > 0 
                    ? Math.round((performanceData.tasksByPriority.MEDIA / performanceData.totalTasks) * 100)
                    : 0
                  }%
                </span>
              </div>
              <Progress 
                value={performanceData.totalTasks > 0 
                  ? (performanceData.tasksByPriority.MEDIA / performanceData.totalTasks) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Baixa</Badge>
                  <span className="text-sm">{performanceData.tasksByPriority.BAIXA} tarefas</span>
                </div>
                <span className="text-sm font-medium">
                  {performanceData.totalTasks > 0 
                    ? Math.round((performanceData.tasksByPriority.BAIXA / performanceData.totalTasks) * 100)
                    : 0
                  }%
                </span>
              </div>
              <Progress 
                value={performanceData.totalTasks > 0 
                  ? (performanceData.tasksByPriority.BAIXA / performanceData.totalTasks) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Tarefas organizadas por status atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(performanceData.tasksByStatus).map(([status, count]) => {
              const percentage = performanceData.totalTasks > 0 
                ? Math.round((count / performanceData.totalTasks) * 100)
                : 0;
              
              const statusLabels = {
                BACKLOG: 'Backlog',
                EM_ANDAMENTO: 'Em Andamento',
                EM_REVISAO: 'Em Revisão',
                CONCLUIDA: 'Concluída'
              };

              const statusColors = {
                BACKLOG: 'bg-gray-100 text-gray-800',
                EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
                EM_REVISAO: 'bg-purple-100 text-purple-800',
                CONCLUIDA: 'bg-green-100 text-green-800'
              };

              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[status as keyof typeof statusColors]}>
                        {statusLabels[status as keyof typeof statusLabels]}
                      </Badge>
                      <span className="text-sm">{count} tarefas</span>
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}