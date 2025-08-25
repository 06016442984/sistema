/*
================================================================================
| FICHEIRO 1: O "CÉREBRO" DA PÁGINA DE DETALHES                                |
| CAMINHO: src/hooks/use-project-details.ts                                    |
================================================================================
*/
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'] & { units: { name: string } | null };
type Task = Database['public']['Tables']['tasks']['Row'];

export function useProjectDetails(projectId: string | null) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Buscar detalhes do projeto e tarefas em paralelo
      const projectPromise = supabase
        .from('projects')
        .select('*, units (name)')
        .eq('id', projectId)
        .single();

      const tasksPromise = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      const [projectResult, tasksResult] = await Promise.all([projectPromise, tasksPromise]);

      if (projectResult.error) throw projectResult.error;
      if (tasksResult.error) throw tasksResult.error;

      setProject(projectResult.data as Project);
      setTasks(tasksResult.data || []);
    } catch (error: any) {
      toast.error('Falha ao carregar os detalhes do projeto.', {
        description: error.message,
      });
      setProject(null); // Limpa em caso de erro para evitar mostrar dados antigos
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  return { loading, project, tasks, fetchProjectData };
}


/*
================================================================================
| FICHEIRO 2: O FORMULÁRIO PARA ADICIONAR NOVA TAREFA                          |
| CAMINHO: src/components/tasks/task-dialog.tsx                                |
================================================================================
*/
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';

const taskSchema = z.object({
  title: z.string().min(3, { message: "O título é obrigatório." }),
  description: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projectId: string;
}

export function TaskDialog({ isOpen, onClose, onTaskCreated, projectId }: TaskDialogProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        title: data.title,
        description: data.description,
        project_id: projectId,
        status: 'To Do', // Status inicial padrão
      });

      if (error) throw error;

      toast.success("Tarefa criada com sucesso!");
      onTaskCreated();
      handleClose();
    } catch (error: any) {
      toast.error("Falha ao criar a tarefa.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Adicione uma nova tarefa a este projeto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input id="title" {...register("title")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.title && <p className="col-span-4 text-red-500 text-xs text-right">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" {...register("description")} className="col-span-3 bg-slate-800 border-slate-700" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" className="btn-premium" disabled={isSubmitting}>
              {isSubmitting ? 'A criar...' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


/*
================================================================================
| FICHEIRO 3: O COMPONENTE QUE MOSTRA A LISTA DE TAREFAS                       |
| CAMINHO: src/components/projects/project-tasks.tsx                           |
================================================================================
*/
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { TaskDialog } from '@/components/tasks/task-dialog';
import type { Database } from '@/types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface ProjectTasksProps {
  tasks: Task[];
  projectId: string;
  onTasksUpdate: () => void;
}

export function ProjectTasks({ tasks, projectId, onTasksUpdate }: ProjectTasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="shadow-lg border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Tarefas do Projeto</CardTitle>
          <Button className="btn-premium" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-800">
                  <TableHead className="text-white">Título</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id} className="border-b border-slate-800 last:border-b-0">
                      <TableCell className="font-medium text-slate-200">{task.title}</TableCell>
                      <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(task.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-400 py-8">
                      Nenhuma tarefa encontrada para este projeto.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onTaskCreated={onTasksUpdate}
        projectId={projectId}
      />
    </>
  );
}


/*
================================================================================
| FICHEIRO 4: A NOVA PÁGINA DE DETALHES DO PROJETO                             |
| CAMINHO: src/app/projects/[id]/page.tsx                                      |
================================================================================
*/
"use client";

import { useParams } from 'next/navigation';
import { useProjectDetails } from '@/hooks/use-project-details';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectTasks } from '@/components/projects/project-tasks';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
    <div className="space-y-6">
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
  );
}
