"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Upload, 
  File, 
  Image, 
  FileVideo, 
  FileAudio, 
  FileText, 
  Download, 
  Trash2 
} from 'lucide-react';

interface AssistantFile {
  id: string;
  nome_original: string;
  tipo_arquivo?: string;
  tamanho_bytes?: number;
  url_download?: string;
  criado_em: string;
}

interface Assistant {
  id: string;
  nome: string;
}

interface FileManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant | null;
  files: AssistantFile[];
  uploading: boolean;
  onFileUpload: (files: FileList) => Promise<void>;
  onFileDelete?: (fileId: string) => Promise<void>;
}

const getFileIcon = (type?: string) => {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileManager({ 
  open, 
  onOpenChange, 
  assistant, 
  files, 
  uploading, 
  onFileUpload,
  onFileDelete 
}: FileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    
    await onFileUpload(selectedFiles);
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background-secondary border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            Arquivos do Assistente
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Gerencie os arquivos que o assistente "{assistant?.nome}" pode acessar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-glass-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
            
            <Upload className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Enviar Arquivos
            </h3>
            <p className="text-text-secondary mb-4">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="bg-glass-bg border-glass-border text-text-primary hover:bg-primary/20"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivos
                </div>
              )}
            </Button>
            <p className="text-xs text-text-secondary mt-2">
              Máximo: 512MB por arquivo
            </p>
          </div>

          {/* Lista de Arquivos */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.length === 0 ? (
              <div className="text-center py-8">
                <File className="h-12 w-12 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary">Nenhum arquivo enviado ainda</p>
              </div>
            ) : (
              files.map((file) => {
                const FileIcon = getFileIcon(file.tipo_arquivo);
                return (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-glass-bg rounded-lg border border-glass-border">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {file.nome_original}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {formatFileSize(file.tamanho_bytes)} • {new Date(file.criado_em).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {file.url_download && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url_download, '_blank')}
                          className="text-text-secondary hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {onFileDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFileDelete(file.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-primary hover:bg-primary/80"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}