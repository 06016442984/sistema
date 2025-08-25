"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { ProjectFile } from '@/types/database';

interface ProjectFilesSectionProps {
  files: ProjectFile[];
  onDownload: (file: ProjectFile) => void;
}

export function ProjectFilesSection({ files, onDownload }: ProjectFilesSectionProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.tipo_arquivo?.startsWith('image/')) return <FileText className="h-4 w-4 text-blue-600" />;
    if (file.tipo_arquivo?.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  if (files.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Arquivos do Projeto</CardTitle>
        <CardDescription>
          Arquivos compartilhados disponíveis para todas as tarefas deste projeto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                {getFileIcon(file)}
                <div>
                  <p className="text-sm font-medium">{file.nome_original}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.tamanho_bytes)} • {file.uploader?.nome || 'Usuário'}
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}