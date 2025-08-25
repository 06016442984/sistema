"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Edit, Upload, Trash2 } from 'lucide-react';

interface Assistant {
  id: string;
  kitchen_id: string;
  nome: string;
  descricao?: string;
  instrucoes?: string;
  assistant_id?: string;
  ativo: boolean;
  criado_em: string;
  kitchens?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

interface AssistantCardProps {
  assistant: Assistant;
  onEdit: (assistant: Assistant) => void;
  onManageFiles: (assistant: Assistant) => void;
  onDelete: (assistant: Assistant) => void;
}

export function AssistantCard({ assistant, onEdit, onManageFiles, onDelete }: AssistantCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-text-primary">{assistant.nome}</CardTitle>
              <CardDescription className="text-text-secondary">
                {assistant.kitchens?.nome}
              </CardDescription>
            </div>
          </div>
          <Badge className={assistant.ativo ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
            {assistant.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {assistant.descricao && (
          <p className="text-sm text-text-secondary line-clamp-3">
            {assistant.descricao}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(assistant)}
            className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageFiles(assistant)}
            className="bg-glass-bg border-glass-border text-text-primary hover:bg-secondary/20"
          >
            <Upload className="h-4 w-4 mr-1" />
            Arquivos
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(assistant)}
            className="bg-glass-bg border-glass-border text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}