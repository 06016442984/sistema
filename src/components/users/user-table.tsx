"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Shield, UserCheck, UserX, RefreshCw, UserPlus, Clock } from 'lucide-react';
import { Profile } from '@/types/database';
import { UserWithRoles } from '@/hooks/use-users';
import { 
  getUserKitchenAccess, 
  formatPhone, 
  formatWorkSchedule, 
  getRoleLabel, 
  getRoleBadgeColor 
} from '@/lib/user-utils';

interface UserTableProps {
  users: UserWithRoles[];
  loading: boolean;
  error: string | null;
  currentUser: Profile | null;
  onRefresh: () => void;
  onCreateUser: () => void;
  onEditUser: (user: Profile) => void;
  onManageRoles: (user: Profile) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
}

export function UserTable({
  users,
  loading,
  error,
  currentUser,
  onRefresh,
  onCreateUser,
  onEditUser,
  onManageRoles,
  onToggleStatus
}: UserTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie usuários, horários de trabalho e suas funções em múltiplas cozinhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800">Erro ao carregar usuários</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie usuários, horários de trabalho e suas funções em múltiplas cozinhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhum usuário encontrado
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={onCreateUser} className="bg-green-600 hover:bg-green-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Usuários</CardTitle>
        <CardDescription>
          Gerencie usuários, horários de trabalho e suas funções em múltiplas cozinhas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Horário de Trabalho</TableHead>
                <TableHead>Acesso a Cozinhas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const kitchenAccess = getUserKitchenAccess(user);
                const workSchedule = formatWorkSchedule(user.hora_inicio, user.hora_fim);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.telefone ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {formatPhone(user.telefone)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Não cadastrado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className={`text-sm font-medium ${workSchedule.className}`}>
                            {workSchedule.display}
                          </p>
                          {workSchedule.hours > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {workSchedule.hours}h/dia
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          {kitchenAccess.summary}
                        </div>
                        
                        {kitchenAccess.groups && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(kitchenAccess.groups).map(([kitchenId, group]) => (
                              <div key={kitchenId} className="bg-gray-100 rounded-md p-1 text-xs">
                                <div className="font-medium text-gray-700 mb-1">
                                  {group.name}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {group.roles.map((role, index) => (
                                    <Badge 
                                      key={index}
                                      className={`text-xs ${getRoleBadgeColor(role)}`}
                                      variant="secondary"
                                    >
                                      {getRoleLabel(role)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.ativo ? "default" : "secondary"}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onManageRoles(user)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Funções
                        </Button>
                        
                        <Button
                          variant={user.ativo ? "outline" : "default"}
                          size="sm"
                          onClick={() => onToggleStatus(user.id, user.ativo)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.ativo ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}