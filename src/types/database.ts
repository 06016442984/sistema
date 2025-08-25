export type UserRole = 'ADMIN' | 'SUPERVISORA' | 'NUTRICIONISTA' | 'AUX_ADM';
export type ProjectStatus = 'ATIVO' | 'PAUSADO' | 'CONCLUIDO';
export type TaskPriority = 'BAIXA' | 'MEDIA' | 'ALTA';
export type TaskStatus = 'BACKLOG' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDA';
export type ReminderType = 'DELEGACAO' | 'INICIO_JORNADA' | 'MEIO_JORNADA' | 'FIM_JORNADA';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string; // Campo WhatsApp
  hora_inicio?: string; // Horário de início da jornada
  hora_fim?: string; // Horário de fim da jornada
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Kitchen {
  id: string;
  nome: string;
  codigo: string;
  endereco?: string;
  ativo: boolean;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface UserKitchenRole {
  id: string;
  user_id: string;
  kitchen_id: string;
  role: UserRole;
  criado_em: string;
  // Dados relacionados
  profiles?: Profile;
  kitchens?: Kitchen;
}

export interface Project {
  id: string;
  kitchen_id: string;
  nome: string;
  descricao?: string;
  status: ProjectStatus;
  inicio_previsto?: string;
  fim_previsto?: string;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  // Dados relacionados
  kitchens?: Kitchen;
  profiles?: Profile;
  tasks?: Task[];
  project_files?: ProjectFile[];
}

export interface Task {
  id: string;
  project_id: string;
  titulo: string;
  descricao?: string;
  prioridade: TaskPriority;
  status: TaskStatus;
  responsavel_id?: string;
  prazo?: string;
  parent_task_id?: string;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  // Dados relacionados
  projects?: Project;
  responsavel?: Profile;
  criador?: Profile;
  subtasks?: Task[];
  task_label_links?: TaskLabelLink[];
  task_comments?: TaskComment[];
  task_files?: TaskFile[];
}

export interface ProjectFile {
  id: string;
  project_id: string;
  nome_arquivo: string;
  nome_original: string;
  tipo_arquivo?: string;
  tamanho_bytes?: number;
  file_path: string;
  uploaded_by?: string;
  criado_em: string;
  ativo: boolean;
  // Dados relacionados
  uploader?: Profile;
}

export interface TaskFile {
  id: string;
  task_id: string;
  nome_arquivo: string;
  nome_original: string;
  tipo_arquivo?: string;
  tamanho_bytes?: number;
  file_path: string;
  uploaded_by?: string;
  criado_em: string;
  ativo: boolean;
  // Dados relacionados
  uploader?: Profile;
}

export interface TaskReminder {
  id: string;
  task_id: string;
  user_id: string;
  reminder_type: ReminderType;
  scheduled_time: string;
  sent: boolean;
  sent_at?: string;
  created_at: string;
}

export interface TaskLabel {
  id: string;
  nome: string;
  cor: string;
  kitchen_id: string;
  criado_em: string;
}

export interface TaskLabelLink {
  id: string;
  task_id: string;
  label_id: string;
  task_labels?: TaskLabel;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  texto: string;
  criado_em: string;
  profiles?: Profile;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  kitchen_id?: string;
  recurso: string;
  recurso_id?: string;
  acao: string;
  payload?: any;
  criado_em: string;
  profiles?: Profile;
  kitchens?: Kitchen;
}

// Tipos para estatísticas e relatórios
export interface KitchenStats {
  kitchen_id: string;
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
}

export interface ProjectStats {
  project_id: string;
  total_tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  tasks_by_priority: Record<TaskPriority, number>;
  completion_rate: number;
}

// Tipos para filtros
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  responsavel_id?: string[];
  label_ids?: string[];
  prazo_inicio?: string;
  prazo_fim?: string;
  search?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  kitchen_id?: string[];
  search?: string;
}

// Tipos para validação de formulários
export interface UserFormData {
  nome: string;
  email: string;
  telefone: string;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

export interface UserFormErrors {
  nome?: string;
  email?: string;
  telefone?: string;
  hora_inicio?: string;
  hora_fim?: string;
}