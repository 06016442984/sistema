"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project, Kitchen } from '@/types/database';
import { ProjectFiles } from '@/components/projects/project-files';
import { ProjectDetailsForm, ProjectFormData } from '@/components/projects/project-details-form';
import { AllProjectFiles } from '@/components/projects/all-project-files';
import { useProjectFiles } from '@/hooks/use-project-files';

interface ProjectDialogTabsProps {
  project: Project | null;
  kitchens: Kitchen[];
  onSubmit: (data: ProjectFormData) => void;
  loading: boolean;
  projectFiles: any[];
  taskFiles: any[];
  loadingFiles: boolean;
}

export function ProjectDialogTabs({ 
  project, 
  kitchens, 
  onSubmit, 
  loading, 
  projectFiles, 
  taskFiles, 
  loadingFiles 
}: ProjectDialogTabsProps) {
  const totalFiles = projectFiles.length + taskFiles.length;

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="files" disabled={!project}>
          Gerenciar {!project && '(Salve primeiro)'}
        </TabsTrigger>
        <TabsTrigger value="all-files" disabled={!project}>
          Todos ({totalFiles}) {!project && '(Salve primeiro)'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <ProjectDetailsForm
          project={project}
          kitchens={kitchens}
          onSubmit={onSubmit}
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="files" className="space-y-4">
        {project ? (
          <ProjectFiles projectId={project.id} projectName={project.nome} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Salve o projeto primeiro para gerenciar arquivos
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="all-files" className="space-y-4">
        {project ? (
          <AllProjectFiles
            projectFiles={projectFiles}
            taskFiles={taskFiles}
            loading={loadingFiles}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Salve o projeto primeiro para ver todos os arquivos
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}