"use client";

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types/database';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn(
        "rounded-lg p-4 mb-4 border-2 border-dashed transition-colors",
        color,
        isOver ? "border-primary bg-primary/10" : "border-transparent"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
            {count}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[200px] p-2 rounded-lg transition-colors",
          isOver ? "bg-primary/5" : "bg-transparent"
        )}
      >
        {children}
      </div>
    </div>
  );
}