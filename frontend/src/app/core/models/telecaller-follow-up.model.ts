export type TelecallerFollowUpType = 'call' | 'meeting' | 'reminder' | 'note';
export type TelecallerFollowUpPriority = 'low' | 'medium' | 'high';
export type TelecallerFollowUpFilter = 'all' | 'today' | 'pending' | 'completed' | 'overdue' | 'upcoming';

export interface TelecallerFollowUp {
  id: number;
  type: TelecallerFollowUpType;
  priority: TelecallerFollowUpPriority;
  notes: string | null;
  next_follow_up_at: string | null;
  completed_at: string | null;
  is_overdue: boolean;
  is_today: boolean;
  telecaller: { id: number; name: string; email: string } | null;
  lead: { id: number; reference: string; applicant_name: string } | null;
  created_at: string | null;
}

export interface TelecallerFollowUpPayload {
  type: TelecallerFollowUpType;
  priority?: TelecallerFollowUpPriority;
  notes?: string | null;
  next_follow_up_at?: string | null;
}
