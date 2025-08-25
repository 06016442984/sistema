"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  User, 
  FileText, 
  Settings, 
  Trash2, 
  Plus,
  Edit,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { AuditLog } from '@/types/database';

interface ActivityChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export function ActivityLog() {
  const { user, userRoles } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && userRoles.length > 0) {
      loadActivityLogs();
    }
  }, [user, userRoles]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const kitchenIds = userRoles.map(role => role.kitchen_id);

      const { data, error: logsError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles(nome, email),
          kitchens(nome)
        `)
        .in('kitchen_id', kitchenIds)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setLogs(data || []);
    } catch (error) {
      setError('Erro ao carregar histórico de atividades');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case 'task':
      case 'tasks':
        return <FileText className="h-4 w-4" />;
      case 'user':
      case 'users':
      case 'profile':
      case 'profiles':
        return <User className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const formatLogMessage = (log: AuditLog) => {
    const userName = log.profiles?.nome || 'Usuário';
    const kitchenName = log.kitchens?.nome || 'Sistema';
    const action = log.acao;
    const resource = log.recurso;

    return `${userName} ${action.toLowerCase()} ${resource.toLowerCase()} em ${kitchenName}`;
  };

  const formatChanges = (payload: any): ActivityChange[] => {
    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const changes: ActivityChange[] = [];

    if (payload.changes && Array.isArray(payload.changes)) {
      return payload.changes;
    }

    if (payload.old && payload.new) {
      Object.keys(payload.new).forEach(key => {
        if (payload.old[key] !== payload.new[key]) {
          changes.push({
            field: key,
            oldValue: payload.old[key],
            newValue: payload.new[key]
          });
        }
      });
    }

    return changes;
  };

  const renderChanges = (log: AuditLog) => {
    if (!log.payload) return null;

    const changes: ActivityChange[] = formatChanges(log.payload);

    if (changes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {changes.map((change, index) => (
          <div key={index} className="text-xs text-muted-foreground">
            <span className="font-medium">{change.field}:</span>
            <span className="ml-1">
              {change.oldValue ? `"${change.oldValue}"` : 'vazio'} → "{change.newValue}"
            </span>
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadActivityLogs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Atividades
        </CardTitle>
        <CardDescription>
          Últimas atividades realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.acao)}
                    {getResourceIcon(log.recurso)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {formatLogMessage(log)}
                      </p>
                      <Badge className={getActionColor(log.acao)}>
                        {log.acao}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(log.criado_em)}
                    </p>
                    
                    {renderChanges(log)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Export default para compatibilidade
export default ActivityLog;