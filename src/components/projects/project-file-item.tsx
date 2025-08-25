"use client";

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ProjectFile, TaskFile } from '@/types/database';
import { formatFileSize, getFileIcon } from '@/lib/file-utils';

interface ProjectFileItemProps {
  file: ProjectFile | TaskFile;
  onDownload: (file: ProjectFile | TaskFile) => void;
  variant?: 'project' | 'task';
  showTaskInfo?: boolean;
}

export function ProjectFileItem({ file, onDownload, variant = 'project', showTaskInfo = false }: ProjectFileItemProps) {
  const bgColor = variant === 'project' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-center gap-3">
        {getFileIcon(file)}
        <div>
          <p className="font-medium">{file.nome_original}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(file.tamanho_bytes)} • 
            {showTaskInfo && 'tasks' in file && file.tasks?.titulo && (
              <> Tarefa: {file.tasks.titulo} • </>
            )}
            Enviado por {file.uploader?.nome || 'Usuário'} • 
            {new Date(file.criado_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDownload(file)}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}