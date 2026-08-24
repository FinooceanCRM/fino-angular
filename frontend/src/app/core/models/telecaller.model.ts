import { AuthenticatedUser } from './user.model';

/** Telecaller-specific profile data (users table holds the identity). */
export interface TelecallerProfile {
  id: number;
  user: AuthenticatedUser;
  designation: string | null;
  employee_code: string | null;
  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  updated_at: string | null;
}

export interface UpdateTelecallerProfilePayload {
  name?: string;
  phone?: string | null;
  designation?: string | null;
  employee_code?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface TelecallerRecentLead {
  id: number;
  reference: string;
  applicant_name: string;
  loan_amount: number;
  status: string;
  status_label: string;
  created_at: string | null;
}

export interface TelecallerPendingFollowUp {
  id: number;
  type: string;
  priority: string;
  notes: string | null;
  next_follow_up_at: string | null;
  lead: { id: number; reference: string; applicant_name: string } | null;
}

export interface TelecallerFollowUpReminders {
  overdue: number;
  today: number;
  upcoming: number;
}

export interface TelecallerDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    department_label: string | null;
    member_since: string | null;
  };
  role: {
    value: string;
    label: string;
    independent: boolean;
    description: string;
  };
  account_status: {
    is_active: boolean;
    status: string;
    profile_complete: boolean;
  };
  submitted_leads: {
    total: number;
    by_status: Record<string, number>;
  };
  recent_leads: TelecallerRecentLead[];
  pd_queue: {
    pending: number;
    completed: number;
  };
  pending_follow_ups: TelecallerPendingFollowUp[];
  follow_up_reminders: TelecallerFollowUpReminders;
}
