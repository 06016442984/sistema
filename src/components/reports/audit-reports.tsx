"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, Activity, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Kitchen, AuditLog } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface AuditLogWithProfile {
  id: string;
  user_id?: string;
  kitchen_id?: string;
  recurso: string;
  recurso_id?: string;
  acao: string;
  payload?: any;
  criado_em: string;
  profiles?: {
    nome: string;
    email: string;
  };
  kitchens?: {
    nome: string;
  };
}

interface AuditReportsProps {
  kitchens: Kitchen[];
  dateRange: { start: string; end: string };
  selectedKitchen: string;
}

export function AuditReports({ kitchens, dateRange, selectedKitchen }: AuditReportsProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [kitchens, dateRange, selectedKitchen]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      const kitchenIds = selectedKitchen === 'all' 
        ? kitchens.map(k => k.id)
        : [selectedKitchen];

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles(nome, email),
          kitchens(nome)
        `)
        .in('kitchen_id', kitchenIds)
        .gte('criado_em', `${dateRange.start}T00:00:00`)
        .lte('criado_em', `${dateRange.end}T23:59:59`)
        .order('criado_em', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge className="bg-green-100 text-green-800">Criado</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800">Atualizado</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">Deletado</Badge>;
      case 'status_change':
        return <Badge className="bg-purple-100 text-purple-800">Status Alterado</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'kitchen':
        return '🏪';
      case 'project':
        return '📁';
      case 'task':
        return '✅';
      case 'user':
        return '👤';
      default:
        return '📄';
    }
  };

  const getResourceLabel = (resource: string) => {
    switch (resource) {
      case 'kitchen':
        return 'Cozinha';
      case 'project':
        return 'Projeto';
      case 'task':
        return 'Tarefa';
      case 'user':
        return 'Usuário';
      default:
        return resource;
    }
  };

  const formatPayload = (payload: any) => {
    if (!payload) return '';
    
    if (typeof payload === 'object') {
      if (payload.from && payload.to) {
        return `${payload.from} → ${payload.to}`;
      }
      return JSON.stringify(payload, null, 2);
    }
    
    return String(payload);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.profiles?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recurso.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.acao === selectedAction;
    const matchesResource = selectedResource === 'all' || log.recurso === selectedResource;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const uniqueActions = [...new Set(auditLogs.map(log => log.acao))];
  const uniqueResources = [...new Set(auditLogs.map(log => log.recurso))];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por usuário ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os recursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os recursos</SelectItem>
                {uniqueResources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {getResourceLabel(resource)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.length}</div>
                <div className="text-sm text-muted-foreground">Total de Ações</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(auditLogs.map(log => log.user_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {auditLogs.filter(log => {
                    const logDate = new Date(log.criado_em);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Hoje</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <div className="text-sm text-muted-foreground">Filtrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Não há atividades registradas no período e filtros selecionados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {log.profiles?.nome?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {log.profiles?.nome || 'Usuário desconhecido'}
                      </span>
                      {getActionBadge(log.acao)}
                      <span className="text-sm text-muted-foreground">
                        {getResourceIcon(log.recurso)} {getResourceLabel(log.recurso)}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      {log.kitchens?.nome && (
                        <span>em {log.kitchens.nome} • </span>
                      )}
                      {formatDate(log.criado_em)}
                    </div>

                    {log.payload && (
                      <div className="text-sm bg-gray-50 dark:bg-gray-800 rounded p-2 font-mono">
                        {formatPayload(log.payload)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}