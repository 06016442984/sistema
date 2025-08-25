"use client";

import { ProjectFilesSection } from './project-files-section';
import { TaskFilesSection } from './task-files-section';
import { ProjectFile, TaskFile } from '@/types/database';

interface TaskFilesTabProps {
  projectFiles: ProjectFile[];
  taskFiles: TaskFile[];
  taskExists: boolean;
  selectedTaskFile: File | null;
  uploadingTaskFile: boolean;
  onTaskFileSelect: (file: File | null) => void;
  onTaskFileUpload: () => void;
  onProjectFileDownload: (file: ProjectFile) => void;
  onTaskFileDownload: (file: TaskFile) => void;
}

export function TaskFilesTab({
  projectFiles,
  taskFiles,
  taskExists,
  selectedTaskFile,
  uploadingTaskFile,
  onTaskFileSelect,
  onTaskFileUpload,
  onProjectFileDownload,
  onTaskFileDownload
}: TaskFilesTabProps) {
  return (
    <div className="space-y-4">
      {/* Arquivos do Projeto */}
      <ProjectFilesSection
        files={projectFiles}
        onDownload={onProjectFileDownload}
      />

      {/* Arquivos da Tarefa */}
      <TaskFilesSection
        files={taskFiles}
        taskExists={taskExists}
        selectedFile={selectedTaskFile}
        uploading={uploadingTaskFile}
        onFileSelect={onTaskFileSelect}
        onUpload={onTaskFileUpload}
        onDownload={onTaskFileDownload}
      />
    </div>
  );
}