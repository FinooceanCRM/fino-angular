/** Real audit trail entry, served by `GET /audit-logs` (Phase 0). */
export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_label: string;
  description: string;
  category: string;
  ip_address: string | null;
}

export interface AuditLogFilters {
  search?: string;
  entity_type?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

/** The seven event types this module tracks, plus a catch-all — mirrors the backend's `category` column. */
export const AUDIT_EVENT_CATEGORY_LABEL: Record<string, string> = {
  user_creation: 'User creation',
  user_update: 'User update',
  team_assignment: 'Team assignment',
  lead_creation: 'Lead creation',
  lead_assignment: 'Lead assignment',
  status_change: 'Status change',
  document_upload: 'Document upload',
  permission_change: 'Permission change',
  other: 'Other',
};

export const AUDIT_EVENT_CATEGORY_ICON: Record<string, string> = {
  user_creation: 'person_add',
  user_update: 'manage_accounts',
  team_assignment: 'group_add',
  lead_creation: 'note_add',
  lead_assignment: 'assignment_ind',
  status_change: 'sync_alt',
  document_upload: 'description',
  permission_change: 'admin_panel_settings',
  other: 'track_changes',
};
