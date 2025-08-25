"use client";

import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen, CheckCircle2, Users, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para os cards de estatísticas
function StatCard({ icon: Icon, title, value, color, bgColor, loading }: any) {
  return (
    <Card className="shadow-lg border-slate-800 bg-slate-900/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para a lista de atividades recentes
function RecentActivities({ activities, loading }: any) {
  return (
    <Card className="shadow-lg border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Activity className="h-5 w-5 text-purple-400" />
          <span>Atividades Recentes</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Últimas atualizações do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-white">
                  {activity.action}
                </p>
                <p className="text-xs text-slate-400">
                  {activity.details}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })} por {activity.user_email}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  // Agora estamos usando nosso hook otimizado para buscar dados reais!
  const { loading, stats, activities, userName } = useDashboardData();

  // Mapeamento dos dados reais para os cards
  const statCards = [
    {
      title: "Projetos em Andamento",
      value: stats?.totalProjects ?? 0,
      icon: FolderOpen,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "Tarefas Concluídas",
      value: stats?.completedTasks ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20"
    },
    {
      title: "Usuários Ativos",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>
        <p className="text-slate-400">
          {loading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            `Bem-vindo(a) de volta, ${userName || 'Usuário'}! Aqui está um resumo das suas atividades.`
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            color={stat.color}
            bgColor={stat.bgColor}
            loading={loading}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        <RecentActivities activities={activities} loading={loading} />
        {/* Aqui podemos adicionar outros componentes, como gráficos, no futuro */}
      </div>
    </div>
  );
}
