export type TelecallerFollowUpType = 'call' | 'meeting' | 'reminder' | 'note';

export interface TelecallerFollowUp {
  id: number;
  type: TelecallerFollowUpType;
  notes: string | null;
  next_follow_up_at: string | null;
  completed_at: string | null;
  telecaller: { id: number; name: string; email: string } | null;
  lead: { id: number; reference: string; applicant_name: string } | null;
  created_at: string | null;
}

export interface TelecallerFollowUpPayload {
  type: TelecallerFollowUpType;
  notes?: string | null;
  next_follow_up_at?: string | null;
}
