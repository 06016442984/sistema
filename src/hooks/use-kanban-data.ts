import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

// Define os tipos de dados que vamos usar
type Task = Database['public']['Tables']['tasks']['Row'] & {
  projects: { name: string } | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};
type Column = { id: string; title: string };

// Define os status que serão as colunas do nosso Kanban
const KANBAN_COLUMNS: Column[] = [
  { id: 'Backlog', title: 'Backlog' },
  { id: 'To Do', title: 'A Fazer' },
  { id: 'In Progress', title: 'Em Andamento' },
  { id: 'Done', title: 'Concluído' },
  { id: 'Canceled', title: 'Cancelado' },
];

const TASKS_PER_COLUMN_LIMIT = 50; // Limite de tarefas a serem carregadas por coluna

/**
 * Hook customizado para buscar os dados do Kanban de forma otimizada.
 * Busca as N tarefas mais recentes para cada coluna em paralelo.
 */
export function useKanbanData() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns] = useState<Column[]>(KANBAN_COLUMNS);

  const fetchKanbanData = useCallback(async () => {
    setLoading(true);
    try {
      // Cria uma "promessa" de busca para cada coluna do Kanban.
      const taskPromises = columns.map(column =>
        supabase
          .from('tasks')
          .select(`
            *,
            projects (name),
            profiles (full_name, avatar_url)
          `)
          .eq('status', column.id)
          .order('created_at', { ascending: false })
          .limit(TASKS_PER_COLUMN_LIMIT)
      );

      // Executa todas as buscas em paralelo para máxima velocidade.
      const results = await Promise.all(taskPromises);

      // Junta os resultados de todas as buscas em uma única lista de tarefas.
      const allTasks: Task[] = [];
      for (const result of results) {
        if (result.error) {
          console.error(`Erro ao buscar tarefas da coluna:`, result.error);
          throw new Error('Falha ao carregar uma ou mais colunas de tarefas.');
        }
        if (result.data) {
          allTasks.push(...(result.data as Task[]));
        }
      }

      setTasks(allTasks);

    } catch (error: any) {
      toast.error('Falha ao carregar o quadro Kanban', {
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, columns]);

  useEffect(() => {
    fetchKanbanData();
  }, [fetchKanbanData]);

  // Função para atualizar o status de uma tarefa quando ela é movida no Kanban
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Atualiza o estado localmente primeiro para uma resposta visual instantânea
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Em seguida, atualiza no banco de dados
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast.error('Falha ao mover a tarefa.');
      // Se der erro, reverte a mudança local
      fetchKanbanData(); 
    }
  };

  return { loading, columns, tasks, updateTaskStatus };
}
