"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { Kitchen, UserKitchenRole, Profile, UserRole } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { AddMemberDialog } from './add-member-dialog';

interface KitchenMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitchen: Kitchen | null;
}

interface MemberWithProfile extends UserKitchenRole {
  profiles: Profile;
}

export function KitchenMembersDialog({ open, onOpenChange, kitchen }: KitchenMembersDialogProps) {
  const { userRoles } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [canManageMembers, setCanManageMembers] = useState(false);

  useEffect(() => {
    if (kitchen && open) {
      loadMembers();
      checkPermissions();
    }
  }, [kitchen, open, userRoles]);

  const checkPermissions = () => {
    if (!kitchen) return;
    
    const userRole = userRoles.find(role => role.kitchen_id === kitchen.id);
    setCanManageMembers(userRole?.role === 'ADMIN');
  };

  const loadMembers = async () => {
    if (!kitchen) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_kitchen_roles')
        .select(`
          *,
          profiles (*)
        `)
        .eq('kitchen_id', kitchen.id)
        .order('criado_em');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('user_kitchen_roles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success('Membro removido com sucesso!');
      loadMembers();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro');
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

  if (!kitchen) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Membros - {kitchen.nome}
            </DialogTitle>
            <DialogDescription>
              Gerencie os membros e suas funções nesta cozinha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {canManageMembers && (
              <div className="flex justify-end">
                <Button onClick={() => setShowAddMember(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Desde</TableHead>
                      {canManageMembers && <TableHead className="w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManageMembers ? 5 : 4} className="text-center py-8">
                          <div className="text-muted-foreground">
                            Nenhum membro encontrado
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.profiles.nome}
                          </TableCell>
                          <TableCell>{member.profiles.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {getRoleLabel(member.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(member.criado_em).toLocaleDateString('pt-BR')}
                          </TableCell>
                          {canManageMembers && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        kitchen={kitchen}
        onMemberAdded={loadMembers}
      />
    </>
  );
}