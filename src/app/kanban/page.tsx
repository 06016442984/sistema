"use client";

import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanFilters } from '@/components/kanban/kanban-filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useKanbanData } from '@/hooks/use-kanban-data';

// Componente de esqueleto para simular o carregamento do Kanban
function KanbanSkeleton() {
  return (
    <div className="flex h-full flex-1 flex-col space-y-4">
      {/* Esqueleto dos filtros */}
      <div className="flex items-center justify-between space-x-2 p-4 border-b border-slate-800">
        <Skeleton className="h-8 w-1/4" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      {/* Esqueleto das colunas */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex space-x-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-72 flex-shrink-0 space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  // Usando nosso novo hook otimizado!
  const { loading, columns, tasks, updateTaskStatus } = useKanbanData();

  // Enquanto carrega, exibe o esqueleto
  if (loading) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <KanbanFilters />
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard 
          columns={columns} 
          tasks={tasks} 
          updateTaskStatus={updateTaskStatus} 
        />
      </div>
    </div>
  );
}
