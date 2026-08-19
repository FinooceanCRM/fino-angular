/** Lead notes — the one genuinely mutable per-lead record in this group (add/delete). */
export interface LeadNote {
  id: number;
  lead_id: number;
  author_name: string;
  author_role: string;
  body: string;
  created_at: string;
}
