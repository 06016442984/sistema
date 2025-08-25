"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Task, Project, Profile, TaskStatus, TaskPriority, Kitchen, ProjectFile, TaskFile } from '@/types/database';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

interface UseTaskDialogProps {
  open: boolean;
  task: Task | null;
  projects: Project[];
  onSaved: () => void;
}

export function useTaskDialog({ open, task, projects, onSaved }: UseTaskDialogProps) {
  const { user, userRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
  const [uploadingTaskFile, setUploadingTaskFile] = useState(false);
  const [selectedTaskFile, setSelectedTaskFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    kitchen_id: '',
    project_id: '',
    prioridade: 'MEDIA' as TaskPriority,
    status: 'BACKLOG' as TaskStatus,
    responsavel_id: '',
    prazo: '',
  });

  // Memoizar unidades disponíveis do usuário (apenas ativas)
  const availableKitchens = useMemo(() => {
    const activeKitchens = userRoles
      .filter(role => {
        const hasKitchen = !!role.kitchens;
        const isActive = role.kitchens?.ativo === true;
        return hasKitchen && isActive;
      })
      .map(role => role.kitchens) as Kitchen[];
    
    return activeKitchens;
  }, [userRoles]);

  const loadUsersForProject = useCallback(async (projectId: string) => {
    if (!projectId) {
      setAvailableUsers([]);
      setDebugInfo('Nenhum projeto selecionado');
      return;
    }

    try {
      setLoadingUsers(true);
      setDebugInfo('Iniciando carregamento...');

      const project = projects.find(p => p.id === projectId);
      if (!project) {
        setDebugInfo('Projeto não encontrado');
        setAvailableUsers([]);
        return;
      }

      setDebugInfo(`Projeto: ${project.nome} | Unidade: ${project.kitchen_id}`);

      const hasAccess = userRoles.some(role => role.kitchen_id === project.kitchen_id);
      if (!hasAccess) {
        setDebugInfo('Você não tem acesso a esta unidade');
        setAvailableUsers([]);
        return;
      }

      const { data: kitchenRoles, error: rolesError } = await supabase
        .from('user_kitchen_roles')
        .select('user_id')
        .eq('kitchen_id', project.kitchen_id);

      if (rolesError) {
        setDebugInfo(`Erro ao buscar funções: ${rolesError.message}`);
        throw new Error(`Erro ao buscar funções da unidade: ${rolesError.message}`);
      }

      if (!kitchenRoles || kitchenRoles.length === 0) {
        setDebugInfo('Nenhum usuário tem acesso a esta unidade');
        setAvailableUsers([]);
        return;
      }

      const userIds = kitchenRoles.map(role => role.user_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone')
        .in('id', userIds)
        .eq('ativo', true);

      if (profilesError) {
        setDebugInfo(`Erro ao buscar perfis: ${profilesError.message}`);
        throw new Error(`Erro ao buscar perfis: ${profilesError.message}`);
      }

      const validProfiles = profilesData || [];
      setAvailableUsers(validProfiles);
      setDebugInfo(`${validProfiles.length} usuário(s) encontrado(s)`);

    } catch (error: any) {
      setDebugInfo(`Erro: ${error.message}`);
      toast.error(`Erro ao carregar usuários: ${error.message}`);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [projects, userRoles]);

  const loadProjectFiles = useCallback(async (projectId: string) => {
    if (!projectId) {
      setProjectFiles([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          setProjectFiles([]);
          return;
        }
        throw error;
      }

      const filesWithUploaders = await Promise.all(
        (data || []).map(async (file) => {
          if (file.uploaded_by) {
            const { data: uploader } = await supabase
              .from('profiles')
              .select('nome, email')
              .eq('id', file.uploaded_by)
              .single();
            
            return { ...file, uploader };
          }
          return file;
        })
      );
      
      setProjectFiles(filesWithUploaders);
    } catch (error: any) {
      console.error('💥 Erro ao carregar arquivos do projeto:', error);
      setProjectFiles([]);
    }
  }, []);

  const loadTaskFiles = useCallback(async (taskId: string) => {
    if (!taskId) {
      setTaskFiles([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_files')
        .select('*')
        .eq('task_id', taskId)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          setTaskFiles([]);
          return;
        }
        throw error;
      }

      const filesWithUploaders = await Promise.all(
        (data || []).map(async (file) => {
          if (file.uploaded_by) {
            const { data: uploader } = await supabase
              .from('profiles')
              .select('nome, email')
              .eq('id', file.uploaded_by)
              .single();
            
            return { ...file, uploader };
          }
          return file;
        })
      );
      
      setTaskFiles(filesWithUploaders);
    } catch (error: any) {
      console.error('💥 Erro ao carregar arquivos da tarefa:', error);
      setTaskFiles([]);
    }
  }, []);

  // Inicializar dados quando o dialog abre
  useEffect(() => {
    if (!open) return;
    
    if (task) {
      const taskProject = projects.find(p => p.id === task.project_id);
      const kitchenId = taskProject?.kitchen_id || '';

      setFormData({
        titulo: task.titulo,
        descricao: task.descricao || '',
        kitchen_id: kitchenId,
        project_id: task.project_id,
        prioridade: task.prioridade,
        status: task.status,
        responsavel_id: task.responsavel_id || '',
        prazo: task.prazo || '',
      });
      
      if (task.prazo) {
        setDate(new Date(task.prazo));
      }

      if (kitchenId) {
        const kitchenProjects = projects.filter(p => p.kitchen_id === kitchenId);
        setAvailableProjects(kitchenProjects);
        
        if (task.project_id) {
          loadUsersForProject(task.project_id);
          loadProjectFiles(task.project_id);
        }
        
        loadTaskFiles(task.id);
      }
    } else {
      const defaultKitchenId = availableKitchens.length > 0 ? availableKitchens[0].id : '';
      
      setFormData({
        titulo: '',
        descricao: '',
        kitchen_id: defaultKitchenId,
        project_id: '',
        prioridade: 'MEDIA',
        status: 'BACKLOG',
        responsavel_id: '',
        prazo: '',
      });
      setDate(undefined);
      setAvailableUsers([]);
      setProjectFiles([]);
      setTaskFiles([]);

      if (defaultKitchenId) {
        const kitchenProjects = projects.filter(p => p.kitchen_id === defaultKitchenId);
        setAvailableProjects(kitchenProjects);
      } else {
        setAvailableProjects([]);
      }
    }
  }, [open, task, projects, availableKitchens, loadUsersForProject, loadProjectFiles, loadTaskFiles]);

  // Carregar projetos quando kitchen_id muda
  useEffect(() => {
    if (!formData.kitchen_id) {
      setAvailableProjects([]);
      return;
    }

    const kitchenProjects = projects.filter(p => p.kitchen_id === formData.kitchen_id);
    setAvailableProjects(kitchenProjects);
  }, [formData.kitchen_id, projects]);

  // Carregar usuários e arquivos quando project_id muda
  useEffect(() => {
    if (!formData.project_id) {
      setAvailableUsers([]);
      setProjectFiles([]);
      return;
    }

    loadUsersForProject(formData.project_id);
    loadProjectFiles(formData.project_id);
  }, [formData.project_id, loadUsersForProject, loadProjectFiles]);

  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleKitchenChange = useCallback((kitchenId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      kitchen_id: kitchenId,
      project_id: '',
      responsavel_id: ''
    }));
    
    setAvailableUsers([]);
    setProjectFiles([]);
    setDebugInfo('Unidade alterada - selecione um projeto');
  }, []);

  const handleProjectChange = useCallback((projectId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      project_id: projectId,
      responsavel_id: ''
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const taskData = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        project_id: formData.project_id,
        prioridade: formData.prioridade,
        status: formData.status,
        responsavel_id: formData.responsavel_id || null,
        prazo: date ? format(date, 'yyyy-MM-dd') : null,
        criado_por: user.id,
      };

      if (task) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id);

        if (error) throw error;
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);

        if (error) throw error;
        toast.success('Tarefa criada com sucesso!');
      }

      onSaved();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    } finally {
      setLoading(false);
    }
  }, [formData, date, task, user, onSaved]);

  return {
    // State
    loading,
    loadingUsers,
    sendingWhatsApp,
    setSendingWhatsApp,
    date,
    setDate,
    availableUsers,
    availableProjects,
    availableKitchens,
    debugInfo,
    projectFiles,
    taskFiles,
    uploadingTaskFile,
    setUploadingTaskFile,
    selectedTaskFile,
    setSelectedTaskFile,
    formData,
    
    // Handlers
    handleFormDataChange,
    handleKitchenChange,
    handleProjectChange,
    handleSubmit,
    loadTaskFiles
  };
}