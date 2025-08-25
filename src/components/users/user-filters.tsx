"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { UserKitchenRole } from '@/types/database';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedKitchen: string;
  onKitchenChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  userRoles: UserKitchenRole[];
  userCount: number;
}

export function UserFilters({
  searchTerm,
  onSearchChange,
  selectedKitchen,
  onKitchenChange,
  selectedRole,
  onRoleChange,
  userRoles,
  userCount
}: UserFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cozinha</Label>
            <Select value={selectedKitchen} onValueChange={onKitchenChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as cozinhas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cozinhas</SelectItem>
                {userRoles.map((role) => (
                  <SelectItem key={role.id} value={role.kitchen_id}>
                    {role.kitchens?.nome || 'Cozinha'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Função</Label>
            <Select value={selectedRole} onValueChange={onRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="SUPERVISORA">Supervisora</SelectItem>
                <SelectItem value="NUTRICIONISTA">Nutricionista</SelectItem>
                <SelectItem value="AUX_ADM">Aux. Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Resultados</Label>
            <div className="text-sm text-muted-foreground pt-2">
              {userCount} usuário(s) encontrado(s)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}