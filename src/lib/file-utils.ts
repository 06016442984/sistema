import { FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProjectFile, TaskFile } from '@/types/database';
import { toast } from 'sonner';

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (file: ProjectFile | TaskFile) => {
  if (file.tipo_arquivo?.startsWith('image/')) return <FileText className="h-4 w-4 text-blue-600" />;
  if (file.tipo_arquivo?.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
  return <FileText className="h-4 w-4 text-gray-600" />;
};

export const downloadProjectFile = async (file: ProjectFile) => {
  try {
    const { data, error } = await supabase.storage
      .from('project-files')
      .download(file.file_path);

    if (error) throw error;

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

export const downloadTaskFile = async (file: TaskFile) => {
  try {
    const { data, error } = await supabase.storage
      .from('task-files')
      .download(file.file_path);

    if (error) throw error;

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