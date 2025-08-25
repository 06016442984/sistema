"use client";

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, MessageSquare, AlertCircle } from 'lucide-react';
import { Profile } from '@/types/database';

interface UserSelectorProps {
  value: string;
  availableUsers: Profile[];
  loadingUsers: boolean;
  projectSelected: boolean;
  onChange: (value: string) => void;
}

export function UserSelector({
  value,
  availableUsers,
  loadingUsers,
  projectSelected,
  onChange
}: UserSelectorProps) {
  const selectedUser = availableUsers.find(u => u.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="responsavel">Responsável</Label>
      <Select
        value={value || 'unassigned'}
        onValueChange={(val) => onChange(val === 'unassigned' ? '' : val)}
        disabled={loadingUsers || !projectSelected}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            loadingUsers 
              ? "Carregando usuários..." 
              : !projectSelected 
                ? "Selecione um projeto primeiro"
                : availableUsers.length === 0
                  ? "Nenhum usuário disponível"
                  : "Selecione um responsável"
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Sem responsável</span>
            </div>
          </SelectItem>
          {availableUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>{user.nome}</span>
                <span className="text-xs text-muted-foreground">({user.email})</span>
                {user.telefone && (
                  <MessageSquare className="h-3 w-3 text-green-500" title="WhatsApp configurado" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* WhatsApp Status */}
      {selectedUser && (
        <div className="flex items-center gap-2 text-xs">
          {selectedUser.telefone ? (
            <div className="flex items-center gap-1 text-green-600">
              <MessageSquare className="h-3 w-3" />
              <span>WhatsApp: {selectedUser.telefone}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>WhatsApp não configurado</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}