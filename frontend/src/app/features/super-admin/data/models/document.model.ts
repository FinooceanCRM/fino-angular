/** Lead documents — read-only in this build (upload isn't in scope), but centralized like every other domain. */
export interface LeadDocument {
  id: number;
  lead_id: number;
  document_type: string;
  file_name: string;
  file_size_kb: number;
  uploaded_by: string;
  uploaded_at: string;
}
