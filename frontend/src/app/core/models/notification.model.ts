export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  is_read: boolean;
  created_at: string | null;
}

export type NotificationCategory = 'leads' | 'documents' | 'system';

export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> = {
  leads: 'Leads',
  documents: 'Documents',
  system: 'System',
};

/** Buckets a notification's backend `type` (e.g. `lead.assigned`, `document.uploaded`) into a display category. */
export function notificationCategory(type: string): NotificationCategory {
  if (type.startsWith('lead.')) {
    return 'leads';
  }
  if (type.startsWith('document.')) {
    return 'documents';
  }
  return 'system';
}

/** Icon shown against a notification, derived from its backend `type`. */
export function notificationIcon(type: string): string {
  if (type.startsWith('lead.access')) {
    return 'lock_open';
  }
  if (type.startsWith('lead.')) {
    return 'track_changes';
  }
  if (type.startsWith('document.')) {
    return 'description';
  }
  return 'notifications';
}
