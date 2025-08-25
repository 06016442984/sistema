"use client";

import { useState, useEffect } from 'react';
import { Copy, Plus, Edit, Trash2, FileText, Star } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { Kitchen } from '@/types/database';
import { toast } from 'sonner';

interface ProjectTemplate {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  tasks_template: TaskTemplate[];
  is_public: boolean;
  created_by: string;
  created_at: string;
  usage_count: number;
}

interface TaskTemplate {
  titulo: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  ordem: number;
  prazo_dias?: number; // Dias após início do projeto
}

interface ProjectTemplatesProps {
  onTemplateSelect: (template: ProjectTemplate) => void;
  selectedKitchen: Kitchen | null;
}

export function ProjectTemplates({ onTemplateSelect, selectedKitchen }: ProjectTemplatesProps) {
  const { user, userRoles } = useAuth();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    is_public: false,
    tasks: [] as TaskTemplate[],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Carregar templates públicos e do usuário
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      
      // Simular alguns templates padrão se não houver dados
      const defaultTemplates: ProjectTemplate[] = [
        {
          id: 'template-1',
          nome: 'Projeto Básico de Cozinha',
          descricao: 'Template padrão para novos projetos de cozinha',
          categoria: 'Básico',
          is_public: true,
          created_by: 'system',
          created_at: new Date().toISOString(),
          usage_count: 15,
          tasks_template: [
            {
              titulo: 'Planejamento inicial',
              descricao: 'Definir objetivos e escopo do projeto',
              prioridade: 'ALTA',
              ordem: 1,
              prazo_dias: 3,
            },
            {
              titulo: 'Análise de recursos',
              descricao: 'Verificar recursos disponíveis',
              prioridade: 'MEDIA',
              ordem: 2,
              prazo_dias: 5,
            },
            {
              titulo: 'Execução',
              descricao: 'Implementar as ações planejadas',
              prioridade: 'ALTA',
              ordem: 3,
              prazo_dias: 14,
            },
            {
              titulo: 'Revisão e ajustes',
              descricao: 'Revisar resultados e fazer ajustes',
              prioridade: 'MEDIA',
              ordem: 4,
              prazo_dias: 21,
            },
          ],
        },
        {
          id: 'template-2',
          nome: 'Implementação de Cardápio',
          descricao: 'Template para projetos de criação/atualização de cardápio',
          categoria: 'Cardápio',
          is_public: true,
          created_by: 'system',
          created_at: new Date().toISOString(),
          usage_count: 8,
          tasks_template: [
            {
              titulo: 'Pesquisa de mercado',
              descricao: 'Analisar tendências e preferências',
              prioridade: 'ALTA',
              ordem: 1,
              prazo_dias: 7,
            },
            {
              titulo: 'Desenvolvimento de receitas',
              descricao: 'Criar e testar novas receitas',
              prioridade: 'ALTA',
              ordem: 2,
              prazo_dias: 14,
            },
            {
              titulo: 'Análise nutricional',
              descricao: 'Verificar valores nutricionais',
              prioridade: 'MEDIA',
              ordem: 3,
              prazo_dias: 18,
            },
            {
              titulo: 'Teste com equipe',
              descricao: 'Testar receitas com a equipe',
              prioridade: 'ALTA',
              ordem: 4,
              prazo_dias: 21,
            },
            {
              titulo: 'Lançamento',
              descricao: 'Implementar novo cardápio',
              prioridade: 'ALTA',
              ordem: 5,
              prazo_dias: 28,
            },
          ],
        },
        {
          id: 'template-3',
          nome: 'Treinamento de Equipe',
          descricao: 'Template para projetos de capacitação',
          categoria: 'Treinamento',
          is_public: true,
          created_by: 'system',
          created_at: new Date().toISOString(),
          usage_count: 12,
          tasks_template: [
            {
              titulo: 'Diagnóstico de necessidades',
              descricao: 'Identificar necessidades de treinamento',
              prioridade: 'ALTA',
              ordem: 1,
              prazo_dias: 3,
            },
            {
              titulo: 'Planejamento do treinamento',
              descricao: 'Definir conteúdo e metodologia',
              prioridade: 'ALTA',
              ordem: 2,
              prazo_dias: 7,
            },
            {
              titulo: 'Preparação de materiais',
              descricao: 'Criar materiais didáticos',
              prioridade: 'MEDIA',
              ordem: 3,
              prazo_dias: 10,
            },
            {
              titulo: 'Execução do treinamento',
              descricao: 'Realizar as sessões de treinamento',
              prioridade: 'ALTA',
              ordem: 4,
              prazo_dias: 14,
            },
            {
              titulo: 'Avaliação de resultados',
              descricao: 'Avaliar eficácia do treinamento',
              prioridade: 'MEDIA',
              ordem: 5,
              prazo_dias: 21,
            },
          ],
        },
      ];

      setTemplates(data?.length ? data : defaultTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !formData.nome.trim()) return;

    try {
      const templateData = {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: formData.categoria,
        tasks_template: formData.tasks,
        is_public: formData.is_public,
        created_by: user.id,
        usage_count: 0,
      };

      // Simular criação (em produção, salvaria no banco)
      const newTemplate: ProjectTemplate = {
        id: `template-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...templateData,
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      toast.success('Template criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    // Incrementar contador de uso
    setTemplates(prev => 
      prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      )
    );
    
    onTemplateSelect(template);
    toast.success(`Template "${template.nome}" aplicado!`);
  };

  const addTask = () => {
    const newTask: TaskTemplate = {
      titulo: '',
      descricao: '',
      prioridade: 'MEDIA',
      ordem: formData.tasks.length + 1,
    };
    setFormData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (index: number, field: keyof TaskTemplate, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      ),
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: '',
      is_public: false,
      tasks: [],
    });
    setEditingTemplate(null);
  };

  const getCategoryBadge = (categoria: string) => {
    const colors: Record<string, string> = {
      'Básico': 'bg-blue-100 text-blue-800',
      'Cardápio': 'bg-green-100 text-green-800',
      'Treinamento': 'bg-purple-100 text-purple-800',
      'Manutenção': 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={colors[categoria] || 'bg-gray-100 text-gray-800'}>
        {categoria}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Templates de Projeto</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Criar Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Template de Projeto</DialogTitle>
              <DialogDescription>
                Crie um template reutilizável para projetos similares
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Template</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome do template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Ex: Cardápio, Treinamento"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o propósito deste template"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Tarefas do Template</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Tarefa
                  </Button>
                </div>

                <ScrollArea className="h-60">
                  <div className="space-y-3">
                    {formData.tasks.map((task, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Tarefa {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            value={task.titulo}
                            onChange={(e) => updateTask(index, 'titulo', e.target.value)}
                            placeholder="Título da tarefa"
                          />
                          <Textarea
                            value={task.descricao}
                            onChange={(e) => updateTask(index, 'descricao', e.target.value)}
                            placeholder="Descrição da tarefa"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={task.prioridade}
                              onChange={(e) => updateTask(index, 'prioridade', e.target.value)}
                              className="px-3 py-2 border rounded-md"
                            >
                              <option value="BAIXA">Baixa</option>
                              <option value="MEDIA">Média</option>
                              <option value="ALTA">Alta</option>
                            </select>
                            <Input
                              type="number"
                              value={task.prazo_dias || ''}
                              onChange={(e) => updateTask(index, 'prazo_dias', parseInt(e.target.value) || undefined)}
                              placeholder="Prazo (dias)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate}>
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-1">{template.nome}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.descricao}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">
                    {template.usage_count}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                {getCategoryBadge(template.categoria)}
                <span className="text-xs text-muted-foreground">
                  {template.tasks_template.length} tarefa{template.tasks_template.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-1">
                {template.tasks_template.slice(0, 3).map((task, index) => (
                  <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    {task.titulo}
                  </div>
                ))}
                {template.tasks_template.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{template.tasks_template.length - 3} mais...
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                size="sm"
                onClick={() => handleUseTemplate(template)}
                disabled={!selectedKitchen}
              >
                <Copy className="mr-2 h-4 w-4" />
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>Nenhum template disponível</p>
          <p className="text-sm">Crie seu primeiro template para reutilizar em projetos futuros</p>
        </div>
      )}
    </div>
  );
}