"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Profile, Kitchen, UserKitchenRole, UserRole } from '@/types/database';

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onSaved: () => void;
}

interface UserRoleWithKitchen extends UserKitchenRole {
  kitchens: Kitchen;
}

export function UserRolesDialog({ open, onOpenChange, user, onSaved }: UserRolesDialogProps) {
  const [userRoles, setUserRoles] = useState<UserRoleWithKitchen[]>([]);
  const [availableKitchens, setAvailableKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('AUX_ADM');

  useEffect(() => {
    if (open && user) {
      loadUserRoles();
      loadAvailableKitchens();
    }
  }, [open, user]);

  const loadUserRoles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_kitchen_roles')
        .select(`
          *,
          kitchens!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('kitchens.ativo', true);

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Erro ao carregar funções:', error);
      toast.error('Erro ao carregar funções do usuário');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableKitchens = async () => {
    try {
      const { data, error } = await supabase
        .from('kitchens')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setAvailableKitchens(data || []);
    } catch (error) {
      console.error('Erro ao carregar cozinhas:', error);
    }
  };

  const handleRoleChange = async (roleId: string, newRole: UserRole) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_kitchen_roles')
        .update({ role: newRole })
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Função alterada com sucesso!');
      loadUserRoles();
    } catch (error) {
      console.error('Erro ao alterar função:', error);
      toast.error('Erro ao alterar função');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleId: string, kitchenName: string) => {
    if (!confirm(`Remover acesso à ${kitchenName}?`)) return;

    try {
      const { error } = await supabase
        .from('user_kitchen_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Acesso removido com sucesso!');
      loadUserRoles();
    } catch (error) {
      console.error('Erro ao remover acesso:', error);
      toast.error('Erro ao remover acesso');
    }
  };

  const handleAddRole = async () => {
    if (!selectedKitchen || !user) return;

    try {
      setSaving(true);

      // Verificar se já existe
      const existing = userRoles.find(role => 
        role.kitchen_id === selectedKitchen && role.role === selectedRole
      );

      if (existing) {
        toast.error('Usuário já possui esta função nesta unidade');
        return;
      }

      const { error } = await supabase
        .from('user_kitchen_roles')
        .insert({
          user_id: user.id,
          kitchen_id: selectedKitchen,
          role: selectedRole
        });

      if (error) throw error;

      toast.success('Função adicionada com sucesso!');
      setSelectedKitchen('');
      setSelectedRole('AUX_ADM');
      loadUserRoles();
    } catch (error) {
      console.error('Erro ao adicionar função:', error);
      toast.error('Erro ao adicionar função');
    } finally {
      setSaving(false);
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

  const getAvailableKitchensForAdd = () => {
    const userKitchenIds = userRoles.map(role => role.kitchen_id);
    return availableKitchens.filter(kitchen => !userKitchenIds.includes(kitchen.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Funções - {user?.nome}</DialogTitle>
          <DialogDescription>
            Edite as funções do usuário em cada unidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Funções Atuais */}
          <div>
            <h3 className="text-lg font-medium mb-4">Funções Atuais</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : userRoles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-6">
                  <p className="text-muted-foreground">Usuário não possui acesso a nenhuma unidade</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {userRoles.map((role) => (
                  <Card key={role.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{role.kitchens.nome}</h4>
                          <p className="text-sm text-muted-foreground">{role.kitchens.codigo}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Select
                            value={role.role}
                            onValueChange={(newRole: UserRole) => handleRoleChange(role.id, newRole)}
                            disabled={saving}
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
                            onClick={() => handleRemoveRole(role.id, role.kitchens.nome)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Nova Função */}
          {getAvailableKitchensForAdd().length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Adicionar Nova Função</h3>
              
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unidade</label>
                      <Select value={selectedKitchen} onValueChange={setSelectedKitchen}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableKitchensForAdd().map((kitchen) => (
                            <SelectItem key={kitchen.id} value={kitchen.id}>
                              {kitchen.nome} ({kitchen.codigo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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

                    <div className="space-y-2">
                      <label className="text-sm font-medium">&nbsp;</label>
                      <Button 
                        onClick={handleAddRole}
                        disabled={!selectedKitchen || saving}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={() => { onSaved(); onOpenChange(false); }}>
              <Save className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}