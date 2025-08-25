"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectDetails } from '@/hooks/use-project-details';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectTasks } from '@/components/projects/project-tasks';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog'; // Importar o novo componente
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
        <Card className="md:col-span-2"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = typeof params.id === 'string' ? params.id : null;
  const { loading, project, tasks, fetchProjectData } = useProjectDetails(projectId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (loading) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-white">Projeto não encontrado</h2>
        <p className="text-slate-400 mt-2">O projeto que procura não existe ou não tem permissão para o ver.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/projects">Voltar para a lista de projetos</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-400">
              Cliente: {project.client_name}
            </p>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Projeto
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-lg border-slate-800 bg-slate-900/50 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Unidade:</span>
                <span className="font-medium text-slate-200">{project.units?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge variant="outline">{project.status}</Badge>
              </div>
               <div className="flex justify-between">
                <span className="text-slate-400">Criado em:</span>
                <span className="font-medium text-slate-200">{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-slate-800 bg-slate-900/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{project.description || 'Nenhuma descrição fornecida.'}</p>
            </CardContent>
          </Card>
        </div>

        <ProjectTasks tasks={tasks} projectId={project.id} onTasksUpdate={fetchProjectData} />
      </div>

      <EditProjectDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onProjectUpdated={fetchProjectData}
        project={project}
      />
    </>
  );
}
