import { AuthenticatedUser } from './user.model';

/** Manager-specific profile data (users table holds the identity). */
export interface ManagerProfile {
  id: number;
  user: AuthenticatedUser;
  manager_code: string | null;
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

export interface UpdateManagerProfilePayload {
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

export interface ManagerReportsTo {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  role_label: string;
  is_active: boolean;
}

export interface ManagerQuickAction {
  label: string;
  route: string;
  icon: string;
}

export interface HierarchyEmployee {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

export interface HierarchyNode {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  employees: HierarchyEmployee[];
}

export interface ManagerDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  manager: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    manager_code: string | null;
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
  reports_to: ManagerReportsTo | null;
  team_summary: {
    relationship_manager_count: number;
    active_relationship_manager_count: number;
    employee_count: number;
    active_employee_count: number;
    total_members: number;
  };
  hierarchy: HierarchyNode[];
  account_status: {
    is_active: boolean;
    status: string;
    profile_complete: boolean;
  };
  quick_actions: ManagerQuickAction[];
}

export interface ManagedRelationshipManager {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_label: string;
  is_active: boolean;
  status: string;
  rm_code: string | null;
  designation: string | null;
  branch: string | null;
  region: string | null;
  employee_count: number;
  active_employee_count: number;
}

export interface ManagedRelationshipManagerList {
  total: number;
  relationship_managers: ManagedRelationshipManager[];
}

export interface CreateRelationshipManagerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  is_active?: boolean;
  designation?: string | null;
  branch?: string | null;
  region?: string | null;
}

export interface UpdateRelationshipManagerPayload {
  name?: string;
  email?: string;
  password?: string | null;
  phone?: string | null;
  is_active?: boolean;
  designation?: string | null;
  branch?: string | null;
  region?: string | null;
}

export interface ManagedEmployee {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_label: string;
  is_active: boolean;
  status: string;
  employee_code: string | null;
  designation: string | null;
  department: string | null;
  relationship_manager: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface ManagedEmployeeList {
  total: number;
  employees: ManagedEmployee[];
}
