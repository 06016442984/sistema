"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Kitchen } from '@/types/database';

interface KitchenReportsProps {
  kitchens: Kitchen[];
  dateRange: { start: string; end: string };
  selectedKitchen: string;
}

interface KitchenStats {
  kitchen_id: string;
  kitchen_name: string;
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function KitchenReports({ kitchens, dateRange, selectedKitchen }: KitchenReportsProps) {
  const [stats, setStats] = useState<KitchenStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKitchenStats();
  }, [kitchens, dateRange, selectedKitchen]);

  const loadKitchenStats = async () => {
    try {
      setLoading(true);

      const targetKitchens = selectedKitchen === 'all' 
        ? kitchens 
        : kitchens.filter(k => k.id === selectedKitchen);

      const kitchenStats = await Promise.all(
        targetKitchens.map(async (kitchen) => {
          // Carregar projetos
          const { data: projects } = await supabase
            .from('projects')
            .select('id, status')
            .eq('kitchen_id', kitchen.id);

          const totalProjects = projects?.length || 0;
          const activeProjects = projects?.filter(p => p.status === 'ATIVO').length || 0;

          // Carregar tarefas
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, status, prazo, projects!inner(kitchen_id)')
            .eq('projects.kitchen_id', kitchen.id)
            .gte('criado_em', `${dateRange.start}T00:00:00`)
            .lte('criado_em', `${dateRange.end}T23:59:59`);

          const totalTasks = tasks?.length || 0;
          const completedTasks = tasks?.filter(t => t.status === 'CONCLUIDA').length || 0;
          const overdueTasks = tasks?.filter(t => 
            t.prazo && new Date(t.prazo) < new Date() && t.status !== 'CONCLUIDA'
          ).length || 0;

          const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          return {
            kitchen_id: kitchen.id,
            kitchen_name: kitchen.nome,
            total_projects: totalProjects,
            active_projects: activeProjects,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            overdue_tasks: overdueTasks,
            completion_rate: Math.round(completionRate),
          };
        })
      );

      setStats(kitchenStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas das cozinhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = stats.reduce(
    (acc, stat) => ({
      total_projects: acc.total_projects + stat.total_projects,
      active_projects: acc.active_projects + stat.active_projects,
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
    name: stat.kitchen_name,
    projetos: stat.total_projects,
    tarefas: stat.total_tasks,
    concluidas: stat.completed_tasks,
    taxa: stat.completion_rate,
  }));

  const pieData = [
    { name: 'Concluídas', value: totalStats.completed_tasks },
    { name: 'Em Andamento', value: totalStats.total_tasks - totalStats.completed_tasks - totalStats.overdue_tasks },
    { name: 'Atrasadas', value: totalStats.overdue_tasks },
  ].filter(item => item.value > 0);

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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Cozinha</CardTitle>
            <CardDescription>
              Comparação de projetos e tarefas entre cozinhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projetos" fill="#8884d8" name="Projetos" />
                <Bar dataKey="tarefas" fill="#82ca9d" name="Tarefas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Tarefas</CardTitle>
            <CardDescription>
              Distribuição geral do status das tarefas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Cozinha */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Cozinha</CardTitle>
          <CardDescription>
            Estatísticas detalhadas de cada cozinha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.kitchen_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{stat.kitchen_name}</h4>
                  <Badge variant={stat.completion_rate >= 80 ? "default" : "secondary"}>
                    {stat.completion_rate}% conclusão
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Projetos</div>
                    <div className="font-medium">{stat.total_projects}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tarefas</div>
                    <div className="font-medium">{stat.total_tasks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Concluídas</div>
                    <div className="font-medium text-green-600">{stat.completed_tasks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Atrasadas</div>
                    <div className="font-medium text-red-600">{stat.overdue_tasks}</div>
                  </div>
                </div>
                
                <Progress value={stat.completion_rate} className="mt-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}