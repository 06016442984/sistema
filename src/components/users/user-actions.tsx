"use client";

import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus, Shield } from 'lucide-react';

interface UserActionsProps {
  onRefresh: () => void;
  onCreateUser: () => void;
}

export function UserActions({ onRefresh, onCreateUser }: UserActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Recarregar
      </Button>
      <Button onClick={onCreateUser} className="bg-green-600 hover:bg-green-700">
        <UserPlus className="h-4 w-4 mr-2" />
        Novo Usuário
      </Button>
      <Button onClick={() => window.open('/permissions', '_blank')}>
        <Shield className="h-4 w-4 mr-2" />
        Gerenciar Permissões
      </Button>
    </div>
  );
}