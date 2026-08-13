export interface LeadDocument {
  id: number;
  loan_lead_id: number;
  document_type: string;
  document_type_label: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  status: string;
  uploaded_by?: { id: number; name: string } | null;
  download_url: string;
  created_at: string | null;
}

export interface DocumentTypeOption {
  value: string;
  label: string;
}
