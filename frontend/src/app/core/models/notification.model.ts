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
