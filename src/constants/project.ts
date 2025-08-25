export const PROJECT_STATUS = {
  ATIVO: 'ATIVO',
  PAUSADO: 'PAUSADO',
  CONCLUIDO: 'CONCLUIDO'
} as const;

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.ATIVO]: 'Ativo',
  [PROJECT_STATUS.PAUSADO]: 'Pausado',
  [PROJECT_STATUS.CONCLUIDO]: 'Concluído'
} as const;

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.ATIVO]: 'bg-green-100 text-green-800',
  [PROJECT_STATUS.PAUSADO]: 'bg-yellow-100 text-yellow-800',
  [PROJECT_STATUS.CONCLUIDO]: 'bg-blue-100 text-blue-800'
} as const;

export const FILE_TYPES = {
  PROJECT: 'project',
  TASK: 'task'
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const FORM_LIMITS = {
  PROJECT_NAME_MIN: 3,
  PROJECT_NAME_MAX: 100,
  PROJECT_DESCRIPTION_MAX: 500
} as const;