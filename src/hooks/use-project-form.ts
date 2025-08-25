"use client";

import { useState, useEffect } from 'react';
import { Project, Kitchen, ProjectStatus } from '@/types/database';

export interface ProjectFormState {
  nome: string;
  descricao: string;
  kitchen_id: string;
  status: ProjectStatus;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export function useProjectForm(project: Project | null, kitchens: Kitchen[]) {
  const [formState, setFormState] = useState<ProjectFormState>({
    nome: '',
    descricao: '',
    kitchen_id: '',
    status: 'ATIVO',
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    if (project) {
      setFormState({
        nome: project.nome,
        descricao: project.descricao || '',
        kitchen_id: project.kitchen_id,
        status: project.status,
        startDate: project.inicio_previsto ? new Date(project.inicio_previsto) : undefined,
        endDate: project.fim_previsto ? new Date(project.fim_previsto) : undefined,
      });
    } else {
      setFormState({
        nome: '',
        descricao: '',
        kitchen_id: kitchens.length > 0 ? kitchens[0].id : '',
        status: 'ATIVO',
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [project, kitchens]);

  const updateField = <K extends keyof ProjectFormState>(
    field: K,
    value: ProjectFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  return {
    formState,
    updateField,
  };
}