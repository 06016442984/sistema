import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];

const PROJECTS_PER_PAGE = 15; // Define quantos projetos serão exibidos por página

/**
 * Hook customizado para buscar dados da página de projetos com paginação.
 */
export function useProjectsData() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProjects = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const from = (page - 1) * PROJECTS_PER_PAGE;
      const to = from + PROJECTS_PER_PAGE - 1;

      // Busca a contagem total de projetos e os projetos da página atual em paralelo
      const projectsPromise = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      const countPromise = supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const [projectsResult, countResult] = await Promise.all([projectsPromise, countPromise]);

      if (projectsResult.error) throw projectsResult.error;
      if (countResult.error) throw countResult.error;

      setProjects(projectsResult.data || []);
      
      const totalCount = countResult.count ?? 0;
      setTotalPages(Math.ceil(totalCount / PROJECTS_PER_PAGE));

    } catch (error: any) {
      toast.error('Falha ao carregar os projetos', {
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage, fetchProjects]);

  return { loading, projects, currentPage, totalPages, setCurrentPage };
}
