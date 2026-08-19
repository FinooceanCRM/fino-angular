/** Audit trail entries — not one of the six named interface groups, but still centralized mock data. */

/** The seven event types this module is required to track, plus a catch-all for everything else already logged. */
export type AuditEventCategory =
  | 'user_creation'
  | 'user_update'
  | 'team_assignment'
  | 'lead_creation'
  | 'lead_assignment'
  | 'status_change'
  | 'document_upload'
  | 'permission_change'
  | 'other';

export const AUDIT_EVENT_CATEGORY_LABEL: Record<AuditEventCategory, string> = {
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

export const AUDIT_EVENT_CATEGORY_ICON: Record<AuditEventCategory, string> = {
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

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_label: string;
  description: string;
  category: AuditEventCategory;
  ip_address: string;
}
