import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

// Tipos para os dados do dashboard para manter o código organizado
type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'] & { projects: { name: string } | null };
type Activity = Database['public']['Tables']['audit_log']['Row'];

interface Stats {
  totalProjects: number;
  totalTasks: number;
  totalUsers: number;
  completedTasks: number;
}

/**
 * Hook customizado para buscar todos os dados necessários para o Dashboard.
 * Esta versão otimizada utiliza Promise.all para executar as consultas
 * ao banco de dados em paralelo, melhorando significativamente o tempo de carregamento.
 */
export function useDashboardData() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userName, setUserName] = useState<string>('');
  
  // O chartData foi removido temporariamente pois a consulta original não era eficiente.
  // Podemos trabalhar em um gráfico otimizado no futuro.
  // const [chartData, setChartData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Primeiro, obtemos o usuário. As outras consultas não dependem dele, mas é bom ter.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Preparamos todas as "promessas" de busca de dados.
      // Elas serão executadas todas de uma vez, em paralelo.
      const profilePromise = supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const projectCountPromise = supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const taskCountPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
      
      // Corrigido para buscar da tabela 'profiles' que contém os usuários do sistema.
      const userCountPromise = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      // Adicionada uma consulta real para tarefas completadas.
      // Assumimos que o status 'Done' significa "concluído".
      const completedTasksCountPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Done');

      const recentProjectsPromise = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const recentTasksPromise = supabase
        .from('tasks')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const recentActivitiesPromise = supabase
        .from('audit_log')
        .select('user_email, action, details, created_at') // Seleciona colunas específicas
        .order('created_at', { ascending: false })
        .limit(5);

      // Usamos Promise.all para esperar que TODAS as buscas terminem.
      const [
        profileResult,
        projectCountResult,
        taskCountResult,
        userCountResult,
        completedTasksCountResult,
        recentProjectsResult,
        recentTasksResult,
        recentActivitiesResult,
      ] = await Promise.all([
        profilePromise,
        projectCountPromise,
        taskCountPromise,
        userCountPromise,
        completedTasksCountPromise,
        recentProjectsPromise,
        recentTasksPromise,
        recentActivitiesPromise,
      ]);

      // Agora, verificamos se alguma delas deu erro.
      const results = [
        profileResult, projectCountResult, taskCountResult, userCountResult,
        completedTasksCountResult, recentProjectsResult, recentTasksResult,
        recentActivitiesResult
      ];
      for (const result of results) {
        if (result.error) {
          console.error("Erro ao buscar dados do dashboard:", result.error);
          throw result.error;
        }
      }
      
      // Se tudo correu bem, atualizamos o estado da aplicação com os novos dados.
      setUserName(profileResult.data?.full_name || '');
      setProjects(recentProjectsResult.data as Project[] || []);
      setTasks(recentTasksResult.data as Task[] || []);
      setActivities(recentActivitiesResult.data as Activity[] || []);
      
      setStats({
        totalProjects: projectCountResult.count ?? 0,
        totalTasks: taskCountResult.count ?? 0,
        totalUsers: userCountResult.count ?? 0,
        completedTasks: completedTasksCountResult.count ?? 0,
      });

    } catch (error: any) {
      toast.error('Falha ao carregar os dados do dashboard', { 
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retornamos os dados para a página do Dashboard usar.
  return { loading, stats, tasks, projects, activities, userName };
}
