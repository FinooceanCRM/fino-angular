import { UserSummary } from './lead.model';

export type FollowUpType = 'call' | 'meeting' | 'reminder' | 'note';

export interface LeadFollowUp {
  id: number;
  type: FollowUpType;
  notes: string | null;
  next_follow_up_at: string | null;
  completed_at: string | null;
  banker: UserSummary | null;
  created_at: string | null;
}

export interface LeadFollowUpPayload {
  type: FollowUpType;
  notes?: string | null;
  next_follow_up_at?: string | null;
}
