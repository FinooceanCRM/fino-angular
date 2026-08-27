/** Tasks domain models (Phase 4). Mirrors the backend's TaskResource shape. */
import { UserSummary } from './lead.model';

export type TaskActivityType = 'call' | 'meeting' | 'task' | 'reminder';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStoredStatus = 'pending' | 'completed' | 'cancelled';
export type TaskDisplayStatus = 'overdue' | 'due_today' | 'upcoming' | 'completed' | 'cancelled';

export interface Task {
  id: number;
  type: TaskActivityType;
  title: string;
  description: string | null;
  related_to: string;
  lead_id: number | null;
  priority: TaskPriority;
  due_at: string;
  status: TaskStoredStatus;
  display_status: TaskDisplayStatus;
  assigned_to: UserSummary | null;
  created_by: UserSummary | null;
  completed_at: string | null;
  created_at: string | null;
}

export interface TaskDraft {
  type: TaskActivityType;
  title: string;
  description: string | null;
  lead_id: number | null;
  priority: TaskPriority;
  due_at: string;
  assigned_to?: number | null;
}

export interface TaskCounts {
  open: number;
  overdue: number;
  dueToday: number;
  completed: number;
}

/** Presentational-only timeline entry, synthesised client-side from a Task (no backend endpoint). */
export interface TaskTimelineEntry {
  icon: string;
  title: string;
  subtitle: string | null;
  time: string;
}

export interface TaskFilters {
  type?: TaskActivityType;
  status?: 'pending' | 'completed' | 'cancelled';
  priority?: TaskPriority;
  due?: TaskDisplayStatus;
  /** Actor-relative scope, not a raw user id — 'team' backs the RM Activities consolidation. */
  assigned_to?: 'me' | 'team';
  page?: number;
  per_page?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
