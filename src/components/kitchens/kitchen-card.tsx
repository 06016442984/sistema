"use client";

import { Edit, Trash2, MapPin, Users, FolderOpen, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Kitchen, UserRole } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface KitchenCardProps {
  kitchen: Kitchen & {
    stats: {
      totalProjects: number;
      activeProjects: number;
      totalTasks: number;
      completedTasks: number;
    };
  };
  userRole: UserRole | null;
  canManage: boolean;
  onEdit: (kitchen: Kitchen) => void;
}

export function KitchenCard({ kitchen, userRole, canManage, onEdit }: KitchenCardProps) {
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{kitchen.nome}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="font-mono text-sm">{kitchen.codigo}</span>
              {userRole && (
                <Badge className={`text-xs ${getRoleBadgeColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </Badge>
              )}
            </CardDescription>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(kitchen)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {kitchen.endereco && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{kitchen.endereco}</span>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">
                {kitchen.stats.totalProjects}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Projetos</div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckSquare className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">
                {kitchen.stats.totalTasks}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Tarefas</div>
          </div>
        </div>

        {/* Progresso */}
        {kitchen.stats.totalTasks > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>
                {Math.round((kitchen.stats.completedTasks / kitchen.stats.totalTasks) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${(kitchen.stats.completedTasks / kitchen.stats.totalTasks) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <Badge variant={kitchen.ativo ? "default" : "secondary"}>
            {kitchen.ativo ? 'Ativa' : 'Inativa'}
          </Badge>
          <span className="text-muted-foreground">
            Criada em {formatDate(kitchen.criado_em)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}