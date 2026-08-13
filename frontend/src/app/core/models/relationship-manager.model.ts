import { AuthenticatedUser } from './user.model';

/** RM-specific profile data (users table holds the identity). */
export interface RelationshipManagerProfile {
  id: number;
  user: AuthenticatedUser;
  rm_code: string | null;
  designation: string | null;
  branch: string | null;
  region: string | null;
  date_of_joining: string | null;
  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  updated_at: string | null;
}

export interface UpdateRelationshipManagerProfilePayload {
  name?: string;
  phone?: string | null;
  designation?: string | null;
  branch?: string | null;
  region?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

/** Read-only summary of a user above the RM in the reporting chain. */
export interface ReportingManager {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  role_label: string;
  is_active: boolean;
}

export interface RelationshipManagerQuickAction {
  label: string;
  route: string;
  icon: string;
}

export interface RelationshipManagerDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  relationship_manager: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    rm_code: string | null;
    designation: string | null;
    branch: string | null;
    region: string | null;
    date_of_joining: string | null;
    member_since: string | null;
  };
  role: {
    value: string;
    label: string;
    description: string;
  };
  manager: ReportingManager | null;
  team_summary: {
    employee_count: number;
    connector_count: number;
    total_members: number;
    active_employee_count: number;
  };
  account_status: {
    is_active: boolean;
    status: string;
    profile_complete: boolean;
  };
  quick_actions: RelationshipManagerQuickAction[];
}

export interface AssignedEmployee {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_label: string;
  is_active: boolean;
  employee_code: string | null;
  designation: string | null;
  department: string | null;
  city: string | null;
  date_of_joining: string | null;
}

export interface AssignedEmployeeList {
  total: number;
  employees: AssignedEmployee[];
}

export interface AssignedConnector {
  id: number;
  user_id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  company_name: string | null;
  contact_person: string | null;
  city: string | null;
  state: string | null;
}

export interface AssignedConnectorList {
  total: number;
  connectors: AssignedConnector[];
}
