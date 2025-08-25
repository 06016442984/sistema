"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Upload, RefreshCw } from 'lucide-react';
import { TaskFile } from '@/types/database';

interface TaskFilesSectionProps {
  files: TaskFile[];
  taskExists: boolean;
  selectedFile: File | null;
  uploading: boolean;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onDownload: (file: TaskFile) => void;
}

export function TaskFilesSection({
  files,
  taskExists,
  selectedFile,
  uploading,
  onFileSelect,
  onUpload,
  onDownload
}: TaskFilesSectionProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: TaskFile) => {
    if (file.tipo_arquivo?.startsWith('image/')) return <FileText className="h-4 w-4 text-blue-600" />;
    if (file.tipo_arquivo?.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Arquivos da Tarefa</CardTitle>
            <CardDescription>
              Arquivos específicos desta tarefa
            </CardDescription>
          </div>
          {taskExists && (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
                className="w-auto"
              />
              <Button
                onClick={onUpload}
                disabled={uploading || !selectedFile}
                size="sm"
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!taskExists ? (
          <p className="text-sm text-muted-foreground">
            Salve a tarefa primeiro para adicionar arquivos específicos
          </p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum arquivo específico da tarefa
          </p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}