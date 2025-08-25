"use client";

import { useEffect, useState } from 'react';
import { Search, Filter, Calendar, User, Activity, FileText, Eye, Download } from 'lucide-react';
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

interface AuditLog {
  id: string;
  user_id: string | null;
  kitchen_id: string | null;
  recurso: string;
  recurso_id: string | null;
  acao: string;
  payload: any;
  criado_em: string;
  profiles?: {
    nome: string;
    email: string;
  };
  kitchens?: {
    nome: string;
    codigo: string;
  };
}

interface Profile {
  id: string;
  nome: string;
  email: string;
}

interface Kitchen {
  id: string;
  nome: string;
  codigo: string;
}

interface Filters {
  user_id: string;
  kitchen_id: string;
  recurso: string;
  acao: string;
  data_inicio: string;
  data_fim: string;
  search: string;
}

export default function AuditPage() {
  const { userRoles } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const itemsPerPage = 50;

  const [filters, setFilters] = useState<Filters>({
    user_id: 'all',
    kitchen_id: 'all',
    recurso: 'all',
    acao: 'all',
    data_inicio: '',
    data_fim: '',
    search: ''
  });

  // Recursos e ações disponíveis
  const recursos = [
    'tasks', 'projects', 'profiles', 'kitchens', 'user_kitchen_roles',
    'task_comments', 'task_files', 'project_files', 'kitchen_contracts',
    'task_assignment', 'whatsapp_notification', 'task_reminders'
  ];

  const acoes = [
    'created', 'updated', 'deleted', 'assigned', 'completed',
    'whatsapp_notification_triggered', 'immediate_api_called',
    'reminders_scheduled', 'trigger_error', 'immediate_skipped'
  ];

  useEffect(() => {
    checkAdminPermission();
  }, [userRoles]);

  useEffect(() => {
    if (isAdmin) {
      loadInitialData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [currentPage, filters, isAdmin]);

  const checkAdminPermission = () => {
    const hasAdminRole = userRoles.some(role => role.role === 'ADMIN');
    setIsAdmin(hasAdminRole);
    
    if (!hasAdminRole) {
      toast.error('Acesso negado. Apenas administradores podem acessar os logs de auditoria.');
    }
  };

  const loadInitialData = async () => {
    try {
      console.log('Carregando dados iniciais...');
      
      // Carregar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .order('nome');

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
        throw usersError;
      }

      // Carregar cozinhas
      const { data: kitchensData, error: kitchensError } = await supabase
        .from('kitchens')
        .select('id, nome, codigo')
        .eq('ativo', true)
        .order('nome');

      if (kitchensError) {
        console.error('Erro ao carregar cozinhas:', kitchensError);
        throw kitchensError;
      }

      console.log('Usuários carregados:', usersData?.length);
      console.log('Cozinhas carregadas:', kitchensData?.length);

      setUsers(usersData || []);
      setKitchens(kitchensData || []);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados iniciais');
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      console.log('Carregando logs com filtros:', filters);

      // Primeiro, testar se a tabela existe e tem dados
      const { data: testData, error: testError } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Erro ao testar tabela audit_logs:', testError);
        throw new Error(`Tabela audit_logs não acessível: ${testError.message}`);
      }

      console.log('Tabela audit_logs acessível, registros encontrados:', testData?.length);

      // Construir query base sem joins primeiro
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.user_id && filters.user_id !== 'all') {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.kitchen_id && filters.kitchen_id !== 'all') {
        query = query.eq('kitchen_id', filters.kitchen_id);
      }

      if (filters.recurso && filters.recurso !== 'all') {
        query = query.eq('recurso', filters.recurso);
      }

      if (filters.acao && filters.acao !== 'all') {
        query = query.eq('acao', filters.acao);
      }

      if (filters.data_inicio) {
        query = query.gte('criado_em', `${filters.data_inicio}T00:00:00`);
      }

      if (filters.data_fim) {
        query = query.lte('criado_em', `${filters.data_fim}T23:59:59`);
      }

      if (filters.search) {
        query = query.or(`recurso.ilike.%${filters.search}%,acao.ilike.%${filters.search}%`);
      }

      // Paginação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data: logsData, error: logsError, count } = await query
        .order('criado_em', { ascending: false })
        .range(from, to);

      if (logsError) {
        console.error('Erro na query de logs:', logsError);
        throw logsError;
      }

      console.log('Logs carregados:', logsData?.length, 'Total:', count);

      // Agora carregar dados relacionados para cada log
      const logsWithRelations = await Promise.all(
        (logsData || []).map(async (log) => {
          const logWithRelations = { ...log };

          // Carregar dados do usuário se existir
          if (log.user_id) {
            try {
              const { data: userData } = await supabase
                .from('profiles')
                .select('nome, email')
                .eq('id', log.user_id)
                .single();
              
              if (userData) {
                logWithRelations.profiles = userData;
              }
            } catch (error) {
              console.warn('Erro ao carregar dados do usuário:', log.user_id, error);
            }
          }

          // Carregar dados da cozinha se existir
          if (log.kitchen_id) {
            try {
              const { data: kitchenData } = await supabase
                .from('kitchens')
                .select('nome, codigo')
                .eq('id', log.kitchen_id)
                .single();
              
              if (kitchenData) {
                logWithRelations.kitchens = kitchenData;
              }
            } catch (error) {
              console.warn('Erro ao carregar dados da cozinha:', log.kitchen_id, error);
            }
          }

          return logWithRelations;
        })
      );

      setLogs(logsWithRelations);
      setTotalLogs(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error(`Erro ao carregar logs de auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset para primeira página
  };

  const clearFilters = () => {
    setFilters({
      user_id: 'all',
      kitchen_id: 'all',
      recurso: 'all',
      acao: 'all',
      data_inicio: '',
      data_fim: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    try {
      // Aqui você pode implementar a exportação para CSV/Excel
      toast.success('Funcionalidade de exportação será implementada em breve');
    } catch (error) {
      toast.error('Erro ao exportar logs');
    }
  };

  const getResourceLabel = (recurso: string) => {
    const labels: Record<string, string> = {
      'tasks': 'Tarefas',
      'projects': 'Projetos',
      'profiles': 'Perfis',
      'kitchens': 'Cozinhas',
      'user_kitchen_roles': 'Funções de Usuário',
      'task_comments': 'Comentários',
      'task_files': 'Arquivos de Tarefa',
      'project_files': 'Arquivos de Projeto',
      'kitchen_contracts': 'Contratos',
      'task_assignment': 'Atribuição de Tarefa',
      'whatsapp_notification': 'Notificação WhatsApp',
      'task_reminders': 'Lembretes'
    };
    return labels[recurso] || recurso;
  };

  const getActionLabel = (acao: string) => {
    const labels: Record<string, string> = {
      'created': 'Criado',
      'updated': 'Atualizado',
      'deleted': 'Excluído',
      'assigned': 'Atribuído',
      'completed': 'Concluído',
      'whatsapp_notification_triggered': 'Notificação Disparada',
      'immediate_api_called': 'API Chamada',
      'reminders_scheduled': 'Lembretes Agendados',
      'trigger_error': 'Erro no Trigger',
      'immediate_skipped': 'Notificação Pulada'
    };
    return labels[acao] || acao;
  };

  const getActionBadgeColor = (acao: string) => {
    const colors: Record<string, string> = {
      'created': 'bg-green-100 text-green-800',
      'updated': 'bg-blue-100 text-blue-800',
      'deleted': 'bg-red-100 text-red-800',
      'assigned': 'bg-purple-100 text-purple-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      'whatsapp_notification_triggered': 'bg-yellow-100 text-yellow-800',
      'immediate_api_called': 'bg-indigo-100 text-indigo-800',
      'reminders_scheduled': 'bg-orange-100 text-orange-800',
      'trigger_error': 'bg-red-100 text-red-800',
      'immediate_skipped': 'bg-gray-100 text-gray-800'
    };
    return colors[acao] || 'bg-gray-100 text-gray-800';
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Apenas administradores podem acessar os logs de auditoria.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Logs de Auditoria
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize todas as atividades do sistema
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalLogs}</div>
                <div className="text-sm text-muted-foreground">Total de Logs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{recursos.length}</div>
                <div className="text-sm text-muted-foreground">Tipos de Recurso</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{currentPage}</div>
                <div className="text-sm text-muted-foreground">Página Atual</div>
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
          <CardDescription>
            Use os filtros para encontrar logs específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca geral */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar em recurso/ação..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Usuário */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Select value={filters.user_id} onValueChange={(value) => handleFilterChange('user_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cozinha */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cozinha</label>
              <Select value={filters.kitchen_id} onValueChange={(value) => handleFilterChange('kitchen_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cozinhas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cozinhas</SelectItem>
                  {kitchens.map((kitchen) => (
                    <SelectItem key={kitchen.id} value={kitchen.id}>
                      {kitchen.nome} ({kitchen.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurso */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recurso</label>
              <Select value={filters.recurso} onValueChange={(value) => handleFilterChange('recurso', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os recursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os recursos</SelectItem>
                  {recursos.map((recurso) => (
                    <SelectItem key={recurso} value={recurso}>
                      {getResourceLabel(recurso)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ação</label>
              <Select value={filters.acao} onValueChange={(value) => handleFilterChange('acao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {acoes.map((acao) => (
                    <SelectItem key={acao} value={acao}>
                      {getActionLabel(acao)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filters.data_inicio}
                onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
              />
            </div>

            {/* Data fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filters.data_fim}
                onChange={(e) => handleFilterChange('data_fim', e.target.value)}
              />
            </div>

            {/* Botão limpar */}
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Atividade</CardTitle>
          <CardDescription>
            Mostrando {logs.length} de {totalLogs} logs (Página {currentPage} de {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Não há logs de auditoria para os filtros selecionados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cozinha</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.criado_em)}
                        </TableCell>
                        <TableCell>
                          {log.profiles ? (
                            <div>
                              <div className="font-medium">{log.profiles.nome}</div>
                              <div className="text-sm text-muted-foreground">{log.profiles.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sistema</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.kitchens ? (
                            <div>
                              <div className="font-medium">{log.kitchens.nome}</div>
                              <div className="text-sm text-muted-foreground">{log.kitchens.codigo}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getResourceLabel(log.recurso)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.acao)}>
                            {getActionLabel(log.acao)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log</DialogTitle>
                                <DialogDescription>
                                  Informações completas sobre esta atividade
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">ID do Log</label>
                                    <p className="text-sm text-muted-foreground font-mono">{log.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Data/Hora</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(log.criado_em)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Recurso ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">{log.recurso_id || '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Usuário ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">{log.user_id || '-'}</p>
                                  </div>
                                </div>
                                {log.payload && (
                                  <div>
                                    <label className="text-sm font-medium">Payload (JSON)</label>
                                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                                      {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalLogs)} de {totalLogs} logs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}