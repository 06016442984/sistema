"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save } from 'lucide-react';

interface Assistant {
  id: string;
  kitchen_id: string;
  nome: string;
  descricao?: string;
  instrucoes?: string;
  ativo: boolean;
}

interface UserRole {
  kitchen_id: string;
  kitchens?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

interface AssistantFormData {
  nome: string;
  descricao: string;
  instrucoes: string;
  kitchen_id: string;
  ativo: boolean;
}

interface AssistantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant | null;
  userRoles: UserRole[];
  onSave: (data: AssistantFormData) => Promise<void>;
  saving: boolean;
}

const getDefaultInstructions = (kitchenName: string, kitchenCode: string) => {
  return `Você é um assistente especializado em gestão de cozinhas. Você está trabalhando especificamente com a cozinha "${kitchenName}" (código: ${kitchenCode}).

Suas principais funções incluem:
- Análise de contratos e documentos
- Gestão de fornecedores e serviços
- Planejamento de cardápios e custos
- Controle de estoque e compras
- Análise de relatórios financeiros
- Suporte em questões operacionais

Sempre seja prestativo, preciso e focado nas necessidades específicas desta cozinha.`;
};

export function AssistantForm({ 
  open, 
  onOpenChange, 
  assistant, 
  userRoles, 
  onSave, 
  saving 
}: AssistantFormProps) {
  const [form, setForm] = useState<AssistantFormData>({
    nome: '',
    descricao: '',
    instrucoes: '',
    kitchen_id: '',
    ativo: true,
  });

  const [errors, setErrors] = useState<Partial<AssistantFormData>>({});

  useEffect(() => {
    if (assistant) {
      setForm({
        nome: assistant.nome,
        descricao: assistant.descricao || '',
        instrucoes: assistant.instrucoes || '',
        kitchen_id: assistant.kitchen_id,
        ativo: assistant.ativo,
      });
    } else {
      setForm({
        nome: '',
        descricao: '',
        instrucoes: '',
        kitchen_id: '',
        ativo: true,
      });
    }
    setErrors({});
  }, [assistant, open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AssistantFormData> = {};

    if (!form.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!form.kitchen_id) {
      newErrors.kitchen_id = 'Unidade é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    await onSave(form);
  };

  const handleKitchenChange = (value: string) => {
    setForm(prev => ({ ...prev, kitchen_id: value }));
    
    // Auto-preencher instruções se estiver criando novo
    if (!assistant && value) {
      const kitchen = userRoles.find(role => role.kitchen_id === value)?.kitchens;
      if (kitchen) {
        setForm(prev => ({ 
          ...prev, 
          instrucoes: getDefaultInstructions(kitchen.nome, kitchen.codigo)
        }));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background-secondary border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            {assistant ? 'Editar Assistente' : 'Novo Assistente'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Configure um assistente especializado para uma unidade específica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-text-primary">Nome do Assistente</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Assistente Nutricionista"
                className={`filter-input ${errors.nome ? 'border-red-500' : ''}`}
              />
              {errors.nome && (
                <p className="text-xs text-red-500">{errors.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitchen" className="text-text-primary">Unidade</Label>
              <Select
                value={form.kitchen_id}
                onValueChange={handleKitchenChange}
              >
                <SelectTrigger className={`filter-input ${errors.kitchen_id ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-glass-border">
                  {userRoles.map((role) => (
                    <SelectItem 
                      key={role.kitchen_id} 
                      value={role.kitchen_id}
                      className="text-text-secondary hover:bg-glass-bg"
                    >
                      {role.kitchens?.nome} ({role.kitchens?.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.kitchen_id && (
                <p className="text-xs text-red-500">{errors.kitchen_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-text-primary">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Breve descrição do assistente..."
              className="filter-input resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucoes" className="text-text-primary">Instruções do Assistente</Label>
            <Textarea
              id="instrucoes"
              value={form.instrucoes}
              onChange={(e) => setForm(prev => ({ ...prev, instrucoes: e.target.value }))}
              placeholder="Instruções detalhadas sobre como o assistente deve se comportar..."
              className="filter-input resize-none"
              rows={8}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={(e) => setForm(prev => ({ ...prev, ativo: e.target.checked }))}
              className="rounded border-glass-border"
            />
            <Label htmlFor="ativo" className="text-text-primary">Assistente ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-glass-bg border-glass-border text-text-primary hover:bg-glass-bg/80"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/80"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {assistant ? 'Atualizar' : 'Criar'}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}