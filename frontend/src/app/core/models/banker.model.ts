import { AuthenticatedUser } from './user.model';

/** Banker-specific profile data (users table holds the identity). */
export interface BankerProfile {
  id: number;
  user: AuthenticatedUser;
  bank_name: string | null;
  branch: string | null;
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

export interface UpdateBankerProfilePayload {
  name?: string;
  phone?: string | null;
  bank_name?: string | null;
  branch?: string | null;
  designation?: string | null;
  employee_code?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface BankerDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
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
  stats: {
    matched_leads: number;
    active_criteria_sets: number;
    assigned_leads: number;
    disbursed_leads: number;
    pending_access_requests: number;
  };
}
