import { z } from 'zod';

export const projectFormSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  
  kitchen_id: z.string()
    .min(1, 'Unidade é obrigatória'),
  
  status: z.enum(['ATIVO', 'PAUSADO', 'CONCLUIDO'], {
    required_error: 'Status é obrigatório'
  }),
  
  inicio_previsto: z.string()
    .nullable()
    .optional(),
  
  fim_previsto: z.string()
    .nullable()
    .optional(),
}).refine((data) => {
  if (data.inicio_previsto && data.fim_previsto) {
    return new Date(data.inicio_previsto) <= new Date(data.fim_previsto);
  }
  return true;
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['fim_previsto']
});

export type ProjectFormSchema = z.infer<typeof projectFormSchema>;