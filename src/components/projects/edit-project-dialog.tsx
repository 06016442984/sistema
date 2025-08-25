"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Project, Kitchen } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { ProjectFormData } from '@/components/projects/project-details-form';
import { ProjectDialogTabs } from '@/components/projects/project-dialog-tabs';
import { useProjectFiles } from '@/hooks/use-project-files';
import { useProjectOperations } from '@/hooks/use-project-operations';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  kitchens: Kitchen[];
  onSaved: () => void;
}

export function EditProjectDialog({ open, onOpenChange, project, kitchens, onSaved }: EditProjectDialogProps) {
  const { user } = useAuth();
  const { projectFiles, taskFiles, loading: loadingFiles, loadAllProjectFiles, clearFiles } = useProjectFiles();
  const { loading, createProject, updateProject } = useProjectOperations();

  useEffect(() => {
    if (project && open) {
      loadAllProjectFiles(project.id);
    } else if (!project && open) {
      clearFiles();
    }
  }, [project, open, loadAllProjectFiles, clearFiles]);

  const handleSubmit = async (formData: ProjectFormData) => {
    if (!user) return;

    let result;
    
    if (project) {
      result = await updateProject(project.id, formData);
    } else {
      result = await createProject(formData, user.id);
    }

    if (result.success) {
      onSaved();
      onOpenChange(false);
    }
  };

  const handleFormSubmit = () => {
    const form = document.querySelector('form');
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Atualize as informações do projeto.'
              : 'Crie um novo projeto para organizar suas tarefas.'
            }
          </DialogDescription>
        </DialogHeader>

        <ProjectDialogTabs
          project={project}
          kitchens={kitchens}
          onSubmit={handleSubmit}
          loading={loading}
          projectFiles={projectFiles}
          taskFiles={taskFiles}
          loadingFiles={loadingFiles}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFormSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : (project ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}