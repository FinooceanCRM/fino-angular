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
  telecaller: [],
  // Affiliates self-register (see the public registration flow) and are
  // never created through the internal Users screen, so this stays empty
  // like every other independent role.
  affiliate: [],
  accounts: [],
  // Self-service street-vendor role. Its in-app actions (certification,
  // loan request) are gated by the DB permission matrix + `role:vendor`
  // API middleware, not by this coarse frontend map.
  vendor: [],
};

export function permissionsForRole(role: UserRole | null): AppPermission[] {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}

/**
 * Roles a given role is allowed to create/assign through the internal Users
 * screen. Affiliate is deliberately excluded from every list — self-service
 * registration is the only way an affiliate account is created, and the
 * internal Create User form has no path to also provision the matching
 * affiliates profile row (referral code, payout details, etc.).
 */
export const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  super_admin: [
    'manager',
    'relationship_manager',
    'employee',
    'connector',
    'banker',
    'telecaller',
    'accounts',
  ],
  manager: ['relationship_manager', 'employee'],
  relationship_manager: ['employee'],
  employee: [],
  banker: [],
  connector: [],
  telecaller: [],
  affiliate: [],
  accounts: [],
  // Vendors self-register through the public "Join as Vendor" page and are
  // never created from the internal Users screen, like every other
  // independent role.
  vendor: [],
};
