"use client";

import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRolesDialog } from '@/components/users/user-roles-dialog';
import { UserDialog } from '@/components/users/user-dialog';
import { UserStats } from '@/components/users/user-stats';
import { UserActions } from '@/components/users/user-actions';
import { UserFilters } from '@/components/users/user-filters';
import { UserTable } from '@/components/users/user-table';
import { useUsers } from '@/hooks/use-users';
import { Profile } from '@/types/database';

export default function UsersPage() {
  const { user: currentUser, userRoles } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKitchen, setSelectedKitchen] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const { users, loading, error, loadUsers, toggleUserStatus } = useUsers({
    userRoles,
    searchTerm,
    selectedKitchen,
    selectedRole
  });

  const handleManageRoles = (user: Profile) => {
    setSelectedUser(user);
    setRolesDialogOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserDialogOpen(true);
  };

  // Verificar se o usuário atual é admin
  const isCurrentUserAdmin = userRoles.some(role => role.role === 'ADMIN');

  if (!isCurrentUserAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie usuários do sistema</p>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Você precisa ser administrador para gerenciar usuários.
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
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">
            Gerencie usuários, horários e suas permissões no sistema
          </p>
        </div>
        
        <UserActions 
          onRefresh={loadUsers}
          onCreateUser={handleCreateUser}
        />
      </div>

      {/* Estatísticas do Sistema */}
      <UserStats />

      {/* Filtros */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedKitchen={selectedKitchen}
        onKitchenChange={setSelectedKitchen}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        userRoles={userRoles}
        userCount={users.length}
      />

      {/* Tabela de Usuários */}
      <UserTable
        users={users}
        loading={loading}
        error={error}
        currentUser={currentUser}
        onRefresh={loadUsers}
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onManageRoles={handleManageRoles}
        onToggleStatus={toggleUserStatus}
      />

      {/* Dialog de Gerenciamento de Funções */}
      <UserRolesDialog
        open={rolesDialogOpen}
        onOpenChange={setRolesDialogOpen}
        user={selectedUser}
        onSaved={loadUsers}
      />

      {/* Dialog de Criação/Edição de Usuário */}
      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={selectedUser}
        onSaved={loadUsers}
      />
    </div>
  );
}