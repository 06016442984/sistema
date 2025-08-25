"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Shield, Users, RefreshCw, ChefHat } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Kitchen, Profile, UserKitchenRole, UserRole } from '@/types/database';

interface KitchenWithUsers extends Kitchen {
  users: Array<{
    profile: Profile;
    role: UserRole;
    roleId: string;
  }>;
}

export default function PermissionsPage() {
  const { user: currentUser, userRoles } = useAuth();
  const [kitchens, setKitchens] = useState<KitchenWithUsers[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKitchen, setSelectedKitchen] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('AUX_ADM');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Verificar se o usuário atual é admin
  const isCurrentUserAdmin = userRoles.some(role => role.role === 'ADMIN');

  useEffect(() => {
    if (isCurrentUserAdmin) {
      loadData();
    }
  }, [isCurrentUserAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar cozinhas ativas
      const { data: kitchensData, error: kitchensError } = await supabase
        .from('kitchens')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (kitchensError) throw kitchensError;

      // Carregar todos os usuários ativos
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (usersError) throw usersError;

      // Para cada cozinha, carregar usuários com funções
      const kitchensWithUsers: KitchenWithUsers[] = [];

      for (const kitchen of kitchensData || []) {
        // Carregar roles da cozinha
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_kitchen_roles')
          .select('id, user_id, role')
          .eq('kitchen_id', kitchen.id);

        if (rolesError) {
          console.error('Erro ao carregar funções da cozinha:', kitchen.nome, rolesError?.message || 'Erro desconhecido');
          kitchensWithUsers.push({
            ...kitchen,
            users: []
          });
          continue;
        }

        // Fazer match com os profiles
        const users = (rolesData || []).map(role => {
          const profile = usersData?.find(user => user.id === role.user_id);
          return {
            profile: profile as Profile,
            role: role.role,
            roleId: role.id
          };
        }).filter(user => user.profile); // Filtrar apenas usuários que existem

        kitchensWithUsers.push({
          ...kitchen,
          users
        });
      }

      setKitchens(kitchensWithUsers);
      setAllUsers(usersData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserToKitchen = async () => {
    if (!selectedKitchen || !selectedUser || !selectedRole) {
      toast.error('Selecione todos os campos');
      return;
    }

    try {
      setSaving(true);

      // Verificar se o usuário já tem essa função nesta cozinha
      const { data: existingRole, error: checkError } = await supabase
        .from('user_kitchen_roles')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('kitchen_id', selectedKitchen)
        .eq('role', selectedRole)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRole) {
        toast.error('Usuário já possui esta função nesta cozinha');
        return;
      }

      const { error } = await supabase
        .from('user_kitchen_roles')
        .insert({
          user_id: selectedUser,
          kitchen_id: selectedKitchen,
          role: selectedRole
        });

      if (error) throw error;

      toast.success('Função adicionada com sucesso!');
      setDialogOpen(false);
      setSelectedKitchen('');
      setSelectedUser('');
      setSelectedRole('AUX_ADM');
      loadData();

    } catch (error) {
      console.error('Erro ao adicionar função:', error);
      toast.error('Erro ao adicionar função');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUserFromKitchen = async (roleId: string, userName: string, kitchenName: string) => {
    if (!confirm(`Remover ${userName} da cozinha ${kitchenName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_kitchen_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Função removida com sucesso!');
      loadData();

    } catch (error) {
      console.error('Erro ao remover função:', error);
      toast.error('Erro ao remover função');
    }
  };

  const handleChangeUserRole = async (roleId: string, newRole: UserRole, userName: string) => {
    try {
      const { error } = await supabase
        .from('user_kitchen_roles')
        .update({ role: newRole })
        .eq('id', roleId);

      if (error) throw error;

      toast.success(`Função de ${userName} alterada com sucesso!`);
      loadData();

    } catch (error) {
      console.error('Erro ao alterar função:', error);
      toast.error('Erro ao alterar função');
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISORA':
        return 'Supervisora';
      case 'NUTRICIONISTA':
        return 'Nutricionista';
      case 'AUX_ADM':
        return 'Aux. Administrativo';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'SUPERVISORA':
        return 'bg-blue-100 text-blue-800';
      case 'NUTRICIONISTA':
        return 'bg-green-100 text-green-800';
      case 'AUX_ADM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableUsersForKitchen = (kitchenId: string) => {
    const kitchen = kitchens.find(k => k.id === kitchenId);
    if (!kitchen) return allUsers;

    const usersInKitchen = kitchen.users.map(u => u.profile.id);
    return allUsers.filter(user => !usersInKitchen.includes(user.id));
  };

  if (!isCurrentUserAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Permissões</h1>
          <p className="text-gray-600">Gerencie funções de usuários por unidade</p>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Você precisa ser administrador para gerenciar permissões.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Permissões</h1>
          <p className="text-gray-600">
            Gerencie funções de usuários em cada unidade ativa
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Função
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Função a Usuário</DialogTitle>
                <DialogDescription>
                  Selecione a unidade, usuário e função para adicionar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidade</label>
                  <Select value={selectedKitchen} onValueChange={setSelectedKitchen}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {kitchens.map((kitchen) => (
                        <SelectItem key={kitchen.id} value={kitchen.id}>
                          {kitchen.nome} ({kitchen.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedKitchen && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuário</label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableUsersForKitchen(selectedKitchen).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.nome} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Função</label>
                  <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="SUPERVISORA">Supervisora</SelectItem>
                      <SelectItem value="NUTRICIONISTA">Nutricionista</SelectItem>
                      <SelectItem value="AUX_ADM">Aux. Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddUserToKitchen}
                    disabled={!selectedKitchen || !selectedUser || saving}
                  >
                    {saving ? 'Salvando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Gerenciamento de Permissões por Unidade</p>
              <p>• Apenas <strong>unidades ativas</strong> são exibidas</p>
              <p>• Cada usuário pode ter <strong>múltiplas funções</strong> na mesma unidade</p>
              <p>• <strong>Administradores</strong> têm acesso total ao sistema</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Unidades */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando unidades...</p>
          </CardContent>
        </Card>
      ) : kitchens.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma unidade ativa encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {kitchens.map((kitchen) => (
            <Card key={kitchen.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      {kitchen.nome}
                    </CardTitle>
                    <CardDescription>
                      Código: {kitchen.codigo} • {kitchen.users.length} usuário(s) com acesso
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Ativa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {kitchen.users.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum usuário com acesso a esta unidade</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função Atual</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kitchen.users.map((userRole) => (
                        <TableRow key={userRole.roleId}>
                          <TableCell className="font-medium">
                            {userRole.profile.nome}
                          </TableCell>
                          <TableCell>{userRole.profile.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(userRole.role)}>
                              {getRoleLabel(userRole.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Select
                                value={userRole.role}
                                onValueChange={(newRole: UserRole) => 
                                  handleChangeUserRole(userRole.roleId, newRole, userRole.profile.nome)
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Administrador</SelectItem>
                                  <SelectItem value="SUPERVISORA">Supervisora</SelectItem>
                                  <SelectItem value="NUTRICIONISTA">Nutricionista</SelectItem>
                                  <SelectItem value="AUX_ADM">Aux. Administrativo</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveUserFromKitchen(
                                  userRole.roleId, 
                                  userRole.profile.nome, 
                                  kitchen.nome
                                )}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}