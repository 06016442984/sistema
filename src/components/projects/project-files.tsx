"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Image as ImageIcon, File, Download, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProjectFile } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

interface ProjectFilesProps {
  projectId: string;
  projectName: string;
}

export function ProjectFiles({ projectId, projectName }: ProjectFilesProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_files')
        .select(`
          *,
          uploader:uploaded_by(nome, email)
        `)
        .eq('project_id', projectId)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      setUploading(true);

      // Upload do arquivo para o Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `projects/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Salvar informações do arquivo no banco
      const fileData = {
        project_id: projectId,
        nome_arquivo: fileName,
        nome_original: selectedFile.name,
        tipo_arquivo: selectedFile.type,
        tamanho_bytes: selectedFile.size,
        file_path: filePath,
        uploaded_by: user.id,
      };

      const { error: insertError } = await supabase
        .from('project_files')
        .insert([fileData]);

      if (insertError) throw insertError;

      toast.success('Arquivo enviado com sucesso!');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      loadFiles();

    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path);

      if (error) throw error;

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.nome_original;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const deleteFile = async (file: ProjectFile) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${file.nome_original}"?`)) {
      return;
    }

    try {
      // Marcar como inativo no banco
      const { error } = await supabase
        .from('project_files')
        .update({ ativo: false })
        .eq('id', file.id);

      if (error) throw error;

      toast.success('Arquivo excluído com sucesso!');
      loadFiles();

    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.tipo_arquivo?.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-600" />;
    if (file.tipo_arquivo?.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Arquivos do Projeto
            </CardTitle>
            <CardDescription>
              Arquivos compartilhados disponíveis para todas as tarefas deste projeto
            </CardDescription>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Arquivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Arquivo ao Projeto</DialogTitle>
                <DialogDescription>
                  Envie um arquivo que ficará disponível para todas as tarefas do projeto "{projectName}"
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo</Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Arquivo selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setSelectedFile(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={uploadFile}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Enviar Arquivo
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Carregando arquivos...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum arquivo adicionado ao projeto</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="font-medium">{file.nome_original}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.tamanho_bytes)} • 
                      Enviado por {file.uploader?.nome || 'Usuário'} • 
                      {new Date(file.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFile(file)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}