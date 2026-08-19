import { AuthenticatedUser } from './user.model';

/** Employee-specific profile data (users table holds the identity). */
export interface EmployeeProfile {
  id: number;
  user: AuthenticatedUser;
  employee_code: string | null;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  updated_at: string | null;
}

export interface UpdateEmployeeProfilePayload {
  name?: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

/** Read-only summary of a user in the employee's reporting chain. */
export interface ReportingUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  role_label: string;
  is_active: boolean;
}

export interface EmployeeQuickAction {
  label: string;
  route: string;
  icon: string;
}

export interface EmployeeDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  employee: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    employee_code: string | null;
    designation: string | null;
    department: string | null;
    date_of_joining: string | null;
    member_since: string | null;
  };
  role: {
    value: string;
    label: string;
    description: string;
  };
  relationship_manager: ReportingUser | null;
  manager: ReportingUser | null;
  account_status: {
    is_active: boolean;
    status: string;
    profile_complete: boolean;
  };
  quick_actions: EmployeeQuickAction[];
  stats: {
    leads_assigned: number;
    pending_documents: number;
    approved_leads: number;
  };
}

export interface EmployeeTeam {
  employee: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role_label: string;
    employee_code: string | null;
    designation: string | null;
    department: string | null;
    is_active: boolean;
  };
  relationship_manager: ReportingUser | null;
  manager: ReportingUser | null;
  reporting_chain: ReportingUser[];
}
