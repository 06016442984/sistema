"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Building, Edit, Trash2, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Project, Task, ProjectStatus, ProjectFile, TaskFile } from '@/types/database';
import { ProjectFiles } from '@/components/projects/project-files';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userRoles } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, userRoles]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Carregar projeto
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          kitchens(nome, codigo),
          profiles(nome, email)
        `)
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Verificar se o usuário tem acesso a esta unidade
      const hasAccess = userRoles.some(role => role.kitchen_id === projectData.kitchen_id);
      if (!hasAccess) {
        toast.error('Você não tem acesso a este projeto');
        router.push('/projects');
        return;
      }

      setProject(projectData);

      // Carregar tarefas do projeto
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          responsavel:responsavel_id(nome, email),
          criador:criado_por(nome, email)
        `)
        .eq('project_id', projectId)
        .order('criado_em', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Carregar arquivos das tarefas com query simplificada
      if (tasksData && tasksData.length > 0) {
        const taskIds = tasksData.map(task => task.id);
        
        console.log('🔄 Carregando arquivos das tarefas para IDs:', taskIds);
        
        const { data: taskFilesData, error: taskFilesError } = await supabase
          .from('task_files')
          .select('*')
          .in('task_id', taskIds)
          .eq('ativo', true)
          .order('criado_em', { ascending: false });

        if (taskFilesError) {
          console.error('Erro ao carregar arquivos das tarefas:', taskFilesError);
        } else {
          console.log('✅ Arquivos das tarefas carregados:', taskFilesData?.length || 0);
          
          // Buscar informações adicionais separadamente
          const filesWithDetails = await Promise.all(
            (taskFilesData || []).map(async (file) => {
              // Buscar nome da tarefa
              const task = tasksData.find(t => t.id === file.task_id);
              
              // Buscar uploader
              let uploader = null;
              if (file.uploaded_by) {
                const { data: uploaderData } = await supabase
                  .from('profiles')
                  .select('nome, email')
                  .eq('id', file.uploaded_by)
                  .single();
                uploader = uploaderData;
              }
              
              return {
                ...file,
                tasks: task ? { titulo: task.titulo } : null,
                uploader
              };
            })
          );
          
          setTaskFiles(filesWithDetails);
        }
      } else {
        setTaskFiles([]);
      }

    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      toast.error('Erro ao carregar projeto');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'PAUSADO': return 'bg-yellow-100 text-yellow-800';
      case 'CONCLUIDO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'ATIVO': return 'Ativo';
      case 'PAUSADO': return 'Pausado';
      case 'CONCLUIDO': return 'Concluído';
      default: return status;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'BACKLOG': return 'bg-gray-100 text-gray-800';
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800';
      case 'EM_REVISAO': return 'bg-yellow-100 text-yellow-800';
      case 'CONCLUIDA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'BACKLOG': return 'Backlog';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'EM_REVISAO': return 'Em Revisão';
      case 'CONCLUIDA': return 'Concluída';
      default: return status;
    }
  };

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

  const downloadTaskFile = async (file: TaskFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-files')
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {project.nome}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {project.kitchens?.nome} • {tasks.length} tarefas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(project.status)} variant="secondary">
            {getStatusLabel(project.status)}
          </Badge>
        </div>
      </div>

      {/* Informações do Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Descrição</h3>
              <p className="text-muted-foreground">
                {project.descricao || 'Nenhuma descrição fornecida'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {project.kitchens?.nome} ({project.kitchens?.codigo})
                </span>
              </div>
              
              {project.profiles && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Criado por {project.profiles.nome}
                  </span>
                </div>
              )}
              
              {(project.inicio_previsto || project.fim_previsto) && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.inicio_previsto && new Date(project.inicio_previsto).toLocaleDateString('pt-BR')}
                    {project.inicio_previsto && project.fim_previsto && ' - '}
                    {project.fim_previsto && new Date(project.fim_previsto).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="files">Arquivos ({taskFiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhuma tarefa criada para este projeto
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.titulo}</CardTitle>
                      <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                        {getTaskStatusLabel(task.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {task.descricao && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.descricao}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {task.responsavel && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{task.responsavel.nome}</span>
                        </div>
                      )}
                      
                      {task.prazo && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.prazo).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {/* Componente para arquivos do projeto */}
          <ProjectFiles projectId={projectId} projectName={project.nome} />
          
          {/* Arquivos das tarefas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Arquivos das Tarefas ({taskFiles.length})
              </CardTitle>
              <CardDescription>
                Arquivos específicos das tarefas deste projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum arquivo das tarefas encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {taskFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="font-medium">{file.nome_original}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.tamanho_bytes)} • 
                            {file.tasks?.titulo ? ` Tarefa: ${file.tasks.titulo} • ` : ' '}
                            Enviado por {file.uploader?.nome || 'Usuário'} • 
                            {new Date(file.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTaskFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}