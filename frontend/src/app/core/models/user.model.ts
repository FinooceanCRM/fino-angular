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

/** Reporting hierarchy. Connector is intentionally outside of it. */
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
  manager_id: number | null;
  relationship_manager_id: number | null;
  employee_id: number | null;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
}

/** A user returned by /api/v1/users. Same shape as the authenticated user. */
export type ManagedUser = AuthenticatedUser;

export interface UserListFilters {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
  page?: number;
  perPage?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  manager_id?: number | null;
  relationship_manager_id?: number | null;
  phone?: string | null;
  is_active?: boolean;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>> & {
  password?: string | null;
};

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
