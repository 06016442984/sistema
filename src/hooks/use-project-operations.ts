"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ProjectFormData } from '@/components/projects/project-details-form';

export function useProjectOperations() {
  const [loading, setLoading] = useState(false);

  const createProject = async (data: ProjectFormData, userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .insert([{ ...data, criado_por: userId }]);

      if (error) throw error;
      
      toast.success('Projeto criado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId: string, data: ProjectFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Projeto atualizado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar projeto');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Projeto excluído com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast.error('Erro ao excluir projeto');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createProject,
    updateProject,
    deleteProject
  };
}