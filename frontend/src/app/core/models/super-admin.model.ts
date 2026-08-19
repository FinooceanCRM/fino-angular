export interface SuperAdminRoleCount {
  role: string;
  label: string;
  count: number;
}

export interface SuperAdminActivityEntry {
  id: number;
  lead_reference: string | null;
  applicant_name: string | null;
  status: string | null;
  status_label: string | null;
  changed_by: string | null;
  created_at: string | null;
}

export interface SuperAdminDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  stats: {
    total_users: number;
    managers: number;
    active_leads: number;
    partner_banks: number;
  };
  users_by_role: SuperAdminRoleCount[];
  recent_activity: SuperAdminActivityEntry[];
}
