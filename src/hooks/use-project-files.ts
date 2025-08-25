"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ProjectFile, TaskFile } from '@/types/database';
import { toast } from 'sonner';

export function useProjectFiles() {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllProjectFiles = useCallback(async (projectId: string) => {
    try {
      setLoading(true);

      // Carregar arquivos do projeto
      const { data: projectFilesData, error: projectFilesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (projectFilesError) {
        console.error('Erro ao carregar arquivos do projeto:', projectFilesError);
      } else {
        // Buscar informações dos uploaders
        const filesWithUploaders = await Promise.all(
          (projectFilesData || []).map(async (file) => {
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
      }

      // Carregar tarefas do projeto
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, titulo')
        .eq('project_id', projectId);

      if (tasksError) {
        console.error('Erro ao carregar tarefas:', tasksError);
        return;
      }

      // Carregar arquivos das tarefas
      if (tasksData && tasksData.length > 0) {
        const taskIds = tasksData.map(task => task.id);
        
        const { data: taskFilesData, error: taskFilesError } = await supabase
          .from('task_files')
          .select('*')
          .in('task_id', taskIds)
          .eq('ativo', true)
          .order('criado_em', { ascending: false });

        if (taskFilesError) {
          console.error('Erro ao carregar arquivos das tarefas:', taskFilesError);
        } else {
          // Buscar informações adicionais
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
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFiles = useCallback(() => {
    setProjectFiles([]);
    setTaskFiles([]);
  }, []);

  return {
    projectFiles,
    taskFiles,
    loading,
    loadAllProjectFiles,
    clearFiles
  };
}