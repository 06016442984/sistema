"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Assistant {
  id: string;
  kitchen_id: string;
  nome: string;
  descricao?: string;
  instrucoes?: string;
  assistant_id?: string;
  ativo: boolean;
  criado_em: string;
  kitchens?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

interface AssistantFile {
  id: string;
  nome_original: string;
  tipo_arquivo?: string;
  tamanho_bytes?: number;
  url_download?: string;
  criado_em: string;
}

interface AssistantFormData {
  nome: string;
  descricao: string;
  instrucoes: string;
  kitchen_id: string;
  ativo: boolean;
}

interface UserRole {
  kitchen_id: string;
  kitchens?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export function useAssistants(userRoles: UserRole[]) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      
      const kitchenIds = userRoles.map(role => role.kitchen_id);
      
      const { data, error } = await supabase
        .from('kitchen_assistants')
        .select(`
          *,
          kitchens(id, nome, codigo)
        `)
        .in('kitchen_id', kitchenIds)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setAssistants(data || []);

    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
      toast.error('Erro ao carregar assistentes');
    } finally {
      setLoading(false);
    }
  };

  const saveAssistant = async (formData: AssistantFormData, editingAssistant?: Assistant | null) => {
    try {
      setSaving(true);

      const assistantData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        instrucoes: formData.instrucoes.trim() || null,
        kitchen_id: formData.kitchen_id,
        ativo: formData.ativo,
      };

      if (editingAssistant) {
        const { error } = await supabase
          .from('kitchen_assistants')
          .update(assistantData)
          .eq('id', editingAssistant.id);

        if (error) throw error;
        toast.success('Assistente atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('kitchen_assistants')
          .insert([assistantData]);

        if (error) throw error;
        toast.success('Assistente criado com sucesso!');
      }

      await loadAssistants();

    } catch (error) {
      console.error('Erro ao salvar assistente:', error);
      toast.error('Erro ao salvar assistente');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteAssistant = async (assistant: Assistant) => {
    try {
      setDeleting(true);

      const { error } = await supabase
        .from('kitchen_assistants')
        .delete()
        .eq('id', assistant.id);

      if (error) throw error;

      toast.success('Assistente excluído com sucesso!');
      await loadAssistants();

    } catch (error) {
      console.error('Erro ao excluir assistente:', error);
      toast.error('Erro ao excluir assistente');
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (userRoles.length > 0) {
      loadAssistants();
    }
  }, [userRoles]);

  return {
    assistants,
    loading,
    saving,
    deleting,
    loadAssistants,
    saveAssistant,
    deleteAssistant,
  };
}

export function useAssistantFiles() {
  const [files, setFiles] = useState<AssistantFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async (assistantId: string) => {
    try {
      // Simular carregamento de arquivos
      setFiles([
        {
          id: '1',
          nome_original: 'contrato_fornecedor.pdf',
          tipo_arquivo: 'application/pdf',
          tamanho_bytes: 1024000,
          criado_em: new Date().toISOString(),
        },
        {
          id: '2',
          nome_original: 'cardapio_semanal.xlsx',
          tipo_arquivo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          tamanho_bytes: 512000,
          criado_em: new Date().toISOString(),
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos');
    }
  };

  const uploadFiles = async (fileList: FileList) => {
    setUploading(true);
    
    try {
      for (const file of Array.from(fileList)) {
        if (file.size > 512 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} muito grande. Máximo: 512MB`);
          continue;
        }

        // Simular upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(`Arquivo ${file.name} enviado com sucesso!`);
      }
      
      // Recarregar arquivos (simular)
      // await loadFiles(assistantId);
      
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro no upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      // Simular exclusão
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Arquivo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  return {
    files,
    uploading,
    loadFiles,
    uploadFiles,
    deleteFile,
  };
}