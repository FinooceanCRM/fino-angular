export interface DashboardReport {
  role: string;
  totals: {
    leads: number;
    approved: number;
    rejected: number;
    disbursed: number;
    in_progress: number;
    new: number;
  };
  by_status: Array<{ status: string; label: string; count: number }>;
  recent_leads: Array<{
    id: number;
    reference: string;
    applicant_name: string;
    loan_amount: number;
    status: string;
    created_at: string | null;
  }>;
  team: Record<string, number>;
}
