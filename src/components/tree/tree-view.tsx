"use client";

import { ChevronDown, ChevronRight, ChefHat, FolderOpen, CheckSquare, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Kitchen, Project, Task } from '@/types/database';
import { TreeNode } from './tree-node';

interface TreeData {
  kitchens: (Kitchen & {
    projects: (Project & {
      tasks: Task[];
    })[];
  })[];
}

interface TreeViewProps {
  data: TreeData;
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onRefresh: () => void;
}

export function TreeView({ data, expandedNodes, onToggleNode, onRefresh }: TreeViewProps) {
  if (data.kitchens.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <ChefHat className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhum resultado encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Tente ajustar seus filtros ou termo de busca.
        </p>
        <Button variant="outline" onClick={onRefresh}>
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.kitchens.map((kitchen) => (
        <TreeNode
          key={kitchen.id}
          type="kitchen"
          data={kitchen}
          level={0}
          expandedNodes={expandedNodes}
          onToggleNode={onToggleNode}
        />
      ))}
    </div>
  );
}