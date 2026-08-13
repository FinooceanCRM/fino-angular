export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'relationship_manager'
  | 'employee'
  | 'banker'
  | 'connector';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  relationship_manager: 'Relationship Manager',
  employee: 'Employee',
  banker: 'Banker',
  connector: 'Connector',
};

/** Hierarchy: super_admin -> manager -> relationship_manager -> employee. */
export const ROLE_HIERARCHY: UserRole[] = [
  'super_admin',
  'manager',
  'relationship_manager',
  'employee',
];

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  parent_id: number | null;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
  token_type: string;
}
