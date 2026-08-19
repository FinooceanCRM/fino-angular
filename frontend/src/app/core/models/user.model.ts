export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'relationship_manager'
  | 'employee'
  | 'banker'
  | 'connector'
  | 'telecaller';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  relationship_manager: 'Relationship Manager',
  employee: 'Employee',
  banker: 'Banker',
  connector: 'Connector',
  telecaller: 'Telecaller',
};

/** Reporting hierarchy. Connector is intentionally outside of it. */
export const ROLE_HIERARCHY: UserRole[] = [
  'super_admin',
  'manager',
  'relationship_manager',
  'employee',
];

/** Loan-product department. Super Admin, Connector and Banker never have one. */
export type Department = 'personal_loan' | 'home_loan' | 'mortgage_loan';

export const DEPARTMENT_LABELS: Record<Department, string> = {
  personal_loan: 'Personal Loan (PL)',
  home_loan: 'Home Loan (HL)',
  mortgage_loan: 'Mortgage Loan (ML)',
};

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  manager_id: number | null;
  relationship_manager_id: number | null;
  employee_id: number | null;
  department: Department | null;
  department_label: string | null;
  phone: string | null;
  is_active: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  notify_on_assignment: boolean;
  notify_on_approval: boolean;
  created_at: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export type UpdatePreferencesPayload = Partial<
  Pick<AuthenticatedUser, 'email_notifications' | 'sms_notifications' | 'notify_on_assignment' | 'notify_on_approval'>
>;

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
  department?: Department | null;
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
