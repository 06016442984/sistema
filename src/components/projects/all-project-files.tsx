"use client";

import { FolderOpen, FileText } from 'lucide-react';
import { ProjectFile, TaskFile } from '@/types/database';
import { downloadProjectFile, downloadTaskFile } from '@/lib/file-utils';
import { FileSection } from '@/components/projects/file-section';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';

interface AllProjectFilesProps {
  projectFiles: ProjectFile[];
  taskFiles: TaskFile[];
  loading: boolean;
}

export function AllProjectFiles({ projectFiles, taskFiles, loading }: AllProjectFilesProps) {
  if (loading) {
    return <LoadingSpinner text="Carregando arquivos..." />;
  }

  const handleDownload = (file: ProjectFile | TaskFile) => {
    if ('project_id' in file) {
      downloadProjectFile(file as ProjectFile);
    } else {
      downloadTaskFile(file as TaskFile);
    }
  };

  const totalFiles = projectFiles.length + taskFiles.length;

  if (totalFiles === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="Nenhum arquivo encontrado"
        description="Este projeto ainda não possui arquivos. Adicione arquivos nas abas de gerenciamento ou nas tarefas específicas."
      />
    );
  }

  return (
    <div className="space-y-4">
      <FileSection
        title="Arquivos do Projeto"
        description="Arquivos compartilhados disponíveis para todas as tarefas"
        icon={<FolderOpen className="h-5 w-5 text-blue-600" />}
        files={projectFiles}
        onDownload={handleDownload}
        variant="project"
        emptyMessage="Nenhum arquivo do projeto"
      />

      <FileSection
        title="Arquivos das Tarefas"
        description="Arquivos específicos das tarefas deste projeto"
        icon={<FileText className="h-5 w-5 text-green-600" />}
        files={taskFiles}
        onDownload={handleDownload}
        variant="task"
        emptyMessage="Nenhum arquivo das tarefas"
      />
    </div>
  );
}