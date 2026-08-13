import { UserRole } from '@core/models/user.model';

/** Mirrors App\Enums\Permission on the backend. */
export type AppPermission =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete';

export const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  super_admin: ['users.view', 'users.create', 'users.update', 'users.delete'],
  manager: ['users.view', 'users.create', 'users.update'],
  relationship_manager: ['users.view', 'users.create', 'users.update'],
  employee: [],
  banker: [],
  connector: [],
};

export function permissionsForRole(role: UserRole | null): AppPermission[] {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}

/** Roles a given role is allowed to create/assign. */
export const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  super_admin: ['manager', 'relationship_manager', 'employee', 'connector'],
  manager: ['relationship_manager', 'employee'],
  relationship_manager: ['employee'],
  employee: [],
  banker: [],
  connector: [],
};
