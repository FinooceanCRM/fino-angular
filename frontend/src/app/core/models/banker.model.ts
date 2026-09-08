import { AuthenticatedUser } from './user.model';

/** Banker-specific profile data (users table holds the identity). */
export interface BankerProfile {
  id: number;
  user: AuthenticatedUser;

  first_name: string | null;
  last_name: string | null;
  country: string | null;
  pan_number: string | null;

  bank_name: string | null;
  branch: string | null;
  branch_address: string | null;
  branch_location: string | null;
  bank_city: string | null;
  bank_state: string | null;
  designation: string | null;
  employee_code: string | null;

  /** Loan-product keys the banker handles. */
  products: string[];
  /** Human-readable labels for `products`, ready to render. */
  product_labels: string[];

  manager_name: string | null;
  manager_email: string | null;
  manager_phone: string | null;

  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;

  status: string;
  status_label: string;
  phone_verified_at: string | null;
  joined_at: string | null;
  updated_at: string | null;
}

export interface UpdateBankerProfilePayload {
  name?: string;
  phone?: string | null;

  first_name?: string | null;
  last_name?: string | null;
  country?: string | null;
  pan_number?: string | null;

  bank_name?: string | null;
  branch?: string | null;
  branch_address?: string | null;
  branch_location?: string | null;
  bank_city?: string | null;
  bank_state?: string | null;
  designation?: string | null;
  employee_code?: string | null;

  products?: string[];

  manager_name?: string | null;
  manager_email?: string | null;
  manager_phone?: string | null;

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
