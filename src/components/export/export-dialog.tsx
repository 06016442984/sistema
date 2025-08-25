"use client";

import { useState } from 'react';
import { Download, FileText, Table, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  children: React.ReactNode;
}

export function ExportDialog({ children }: ExportDialogProps) {
  const { userRoles } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dataTypes, setDataTypes] = useState({
    tasks: true,
    projects: false,
    kitchens: false,
    users: false,
  });
  const [dateRange, setDateRange] = useState({
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      const kitchenIds = userRoles.map(role => role.kitchen_id);
      const exportData: any = {};

      // Exportar tarefas
      if (dataTypes.tasks) {
        let query = supabase
          .from('tasks')
          .select(`
            id, titulo, descricao, prioridade, status, prazo, criado_em,
            projects(nome, kitchens(nome)),
            responsavel:profiles(nome, email)
          `)
          .in('projects.kitchen_id', kitchenIds);

        if (dateRange.from) {
          query = query.gte('criado_em', dateRange.from.toISOString());
        }
        if (dateRange.to) {
          query = query.lte('criado_em', dateRange.to.toISOString());
        }

        const { data: tasks, error } = await query;
        if (error) throw error;
        exportData.tasks = tasks;
      }

      // Exportar projetos
      if (dataTypes.projects) {
        const { data: projects, error } = await supabase
          .from('projects')
          .select(`
            id, nome, descricao, status, inicio_previsto, fim_previsto, criado_em,
            kitchens(nome, codigo)
          `)
          .in('kitchen_id', kitchenIds);

        if (error) throw error;
        exportData.projects = projects;
      }

      // Exportar cozinhas
      if (dataTypes.kitchens) {
        const { data: kitchens, error } = await supabase
          .from('kitchens')
          .select('id, nome, codigo, endereco, ativo, criado_em')
          .in('id', kitchenIds);

        if (error) throw error;
        exportData.kitchens = kitchens;
      }

      // Exportar usuários (apenas para admins)
      if (dataTypes.users && userRoles.some(role => role.role === 'ADMIN')) {
        const { data: users, error } = await supabase
          .from('profiles')
          .select(`
            id, nome, email, ativo, criado_em,
            user_kitchen_roles(role, kitchens(nome))
          `);

        if (error) throw error;
        exportData.users = users;
      }

      // Processar exportação baseada no tipo
      if (exportType === 'csv') {
        await exportToCSV(exportData);
      } else if (exportType === 'json') {
        await exportToJSON(exportData);
      } else if (exportType === 'pdf') {
        await exportToPDF(exportData);
      }

      toast.success('Dados exportados com sucesso!');
      setOpen(false);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (data: any) => {
    const csvContent: string[] = [];

    Object.keys(data).forEach(key => {
      if (data[key] && data[key].length > 0) {
        csvContent.push(`\n=== ${key.toUpperCase()} ===`);
        
        // Headers
        const headers = Object.keys(data[key][0]).filter(h => typeof data[key][0][h] !== 'object');
        csvContent.push(headers.join(','));
        
        // Data
        data[key].forEach((item: any) => {
          const row = headers.map(header => {
            const value = item[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          });
          csvContent.push(row.join(','));
        });
      }
    });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kitchen-manager-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = async (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kitchen-manager-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async (data: any) => {
    // Para PDF, vamos criar um HTML simples e usar window.print
    const htmlContent = `
      <html>
        <head>
          <title>Kitchen Manager - Relatório</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Kitchen Manager - Relatório de Exportação</h1>
          <div class="summary">
            <p><strong>Data de Exportação:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            <p><strong>Dados Exportados:</strong> ${Object.keys(data).join(', ')}</p>
          </div>
          ${Object.keys(data).map(key => `
            <h2>${key.charAt(0).toUpperCase() + key.slice(1)}</h2>
            <p>Total de registros: ${data[key]?.length || 0}</p>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const isAdmin = userRoles.some(role => role.role === 'ADMIN');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
          <DialogDescription>
            Exporte dados do sistema em diferentes formatos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Exportação */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    PDF (Relatório)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipos de Dados */}
          <div className="space-y-3">
            <Label>Dados para Exportar</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tasks"
                  checked={dataTypes.tasks}
                  onCheckedChange={(checked) => 
                    setDataTypes(prev => ({ ...prev, tasks: !!checked }))
                  }
                />
                <Label htmlFor="tasks">Tarefas</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="projects"
                  checked={dataTypes.projects}
                  onCheckedChange={(checked) => 
                    setDataTypes(prev => ({ ...prev, projects: !!checked }))
                  }
                />
                <Label htmlFor="projects">Projetos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kitchens"
                  checked={dataTypes.kitchens}
                  onCheckedChange={(checked) => 
                    setDataTypes(prev => ({ ...prev, kitchens: !!checked }))
                  }
                />
                <Label htmlFor="kitchens">Cozinhas</Label>
              </div>
              
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="users"
                    checked={dataTypes.users}
                    onCheckedChange={(checked) => 
                      setDataTypes(prev => ({ ...prev, users: !!checked }))
                    }
                  />
                  <Label htmlFor="users">Usuários (Admin)</Label>
                </div>
              )}
            </div>
          </div>

          {/* Filtro de Data */}
          <div className="space-y-3">
            <Label>Filtro por Data (Opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={loading || !Object.values(dataTypes).some(Boolean)}
          >
            {loading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}