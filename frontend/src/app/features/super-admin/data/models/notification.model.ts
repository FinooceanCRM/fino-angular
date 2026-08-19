/** The Super Admin module's "Notifications" interface group. */

export type NotificationCategory = 'users' | 'leads' | 'documents' | 'banking' | 'commission' | 'system';

export interface AppNotification {
  id: number;
  category: NotificationCategory;
  icon: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> = {
  users: 'Users',
  leads: 'Leads',
  documents: 'Documents',
  banking: 'Banking',
  commission: 'Commissions',
  system: 'System',
};
