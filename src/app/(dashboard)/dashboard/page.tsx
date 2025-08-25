"use client";

import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  FolderOpen, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();

  const stats = [
    {
      title: "Cozinhas Ativas",
      value: "12",
      change: "+2 este mês",
      icon: Building2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Projetos em Andamento",
      value: "8",
      change: "+1 esta semana",
      icon: FolderOpen,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "Usuários Ativos",
      value: "45",
      change: "+5 este mês",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    {
      title: "Tarefas Concluídas",
      value: "127",
      change: "+23 esta semana",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Nova cozinha criada",
      description: "Cozinha Central - São Paulo",
      time: "2 horas atrás",
      type: "success"
    },
    {
      id: 2,
      action: "Projeto atualizado",
      description: "Reforma Cozinha Norte",
      time: "4 horas atrás",
      type: "info"
    },
    {
      id: 3,
      action: "Usuário adicionado",
      description: "João Silva - Chef",
      time: "1 dia atrás",
      type: "success"
    },
    {
      id: 4,
      action: "Tarefa atrasada",
      description: "Instalação de equipamentos",
      time: "2 dias atrás",
      type: "warning"
    }
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">
          Dashboard
        </h1>
        <p className="text-slate-400">
          Bem-vindo de volta, {profile?.nome || 'Usuário'}! Aqui está um resumo das suas atividades.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="stat-card" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <Card className="glass-card">
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
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <span>Ações Rápidas</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button className="btn-premium text-left p-4 h-auto">
                <Building2 className="h-5 w-5 mb-2" />
                <div>
                  <p className="font-medium">Nova Cozinha</p>
                  <p className="text-xs opacity-80">Cadastrar unidade</p>
                </div>
              </button>
              
              <button className="btn-premium text-left p-4 h-auto">
                <FolderOpen className="h-5 w-5 mb-2" />
                <div>
                  <p className="font-medium">Novo Projeto</p>
                  <p className="text-xs opacity-80">Criar projeto</p>
                </div>
              </button>
              
              <button className="btn-premium text-left p-4 h-auto">
                <Users className="h-5 w-5 mb-2" />
                <div>
                  <p className="font-medium">Adicionar Usuário</p>
                  <p className="text-xs opacity-80">Convidar membro</p>
                </div>
              </button>
              
              <button className="btn-premium text-left p-4 h-auto">
                <CheckCircle2 className="h-5 w-5 mb-2" />
                <div>
                  <p className="font-medium">Nova Tarefa</p>
                  <p className="text-xs opacity-80">Criar atividade</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Status Geral do Sistema</CardTitle>
          <CardDescription className="text-slate-400">
            Visão geral do status de todas as operações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Sistema Online</h3>
              <p className="text-sm text-slate-400">Todos os serviços funcionando</p>
              <Badge className="badge-success">Operacional</Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Backup Automático</h3>
              <p className="text-sm text-slate-400">Último backup: 2h atrás</p>
              <Badge className="badge-primary">Ativo</Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-white">Manutenção</h3>
              <p className="text-sm text-slate-400">Próxima: Domingo 02:00</p>
              <Badge className="badge-warning">Agendada</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}