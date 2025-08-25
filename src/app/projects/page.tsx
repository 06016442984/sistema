"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Importar o useRouter
import { useProjectsData } from '@/hooks/use-projects-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import { ProjectDialog } from '@/components/projects/project-dialog';

function ProjectsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="border rounded-lg border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-800">
              <TableHead><Skeleton className="h-5 w-24" /></TableHead>
              <TableHead><Skeleton className="h-5 w-24" /></TableHead>
              <TableHead><Skeleton className="h-5 w-16" /></TableHead>
              <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i} className="border-slate-800">
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: any) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-800">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      <span className="text-sm text-slate-400">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Próxima
      </Button>
    </div>
  );
}

export default function ProjectsPage() {
  const { loading, projects, currentPage, totalPages, setCurrentPage, fetchProjects } = useProjectsData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter(); // Adicionar o router

  const handleProjectCreated = () => {
    fetchProjects(1);
    setCurrentPage(1);
  };

  // Função para navegar para a página de detalhes
  const handleRowClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projetos</h1>
            <p className="text-slate-400">
              Visualize e gira todos os seus projetos.
            </p>
          </div>
          <Button className="btn-premium" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        <Card className="shadow-lg border-slate-800 bg-slate-900/50">
          <CardContent className="p-0">
            {loading ? (
              <ProjectsSkeleton />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-slate-800">
                        <TableHead className="text-white">Nome do Projeto</TableHead>
                        <TableHead className="text-white">Cliente</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Data de Criação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow 
                          key={project.id} 
                          className="border-b border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-800/50"
                          onClick={() => handleRowClick(project.id)} // Adicionar evento de clique
                        >
                          <TableCell className="font-medium text-slate-200">{project.name}</TableCell>
                          <TableCell className="text-slate-400">{project.client_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.status}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(project.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <ProjectDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
