/**
 * The Super Admin module's role/permission system. Deliberately separate
 * from `@core/models/user.model`'s real `UserRole` and `@core/auth/permissions`
 * — those drive actual authentication/authorization against the backend and
 * are out of scope here. `ExtendedRole` covers the same six real roles plus
 * two roles the original WordPress system had (Accounts, Support — see
 * PUBLIC_HTML_ANALYSIS.md section 1) that were never carried into the
 * rebuilt app's role enum. This lets the permission matrix model the full
 * eight-role system without touching the live auth flow.
 */
export type ExtendedRole =
  | 'super_admin'
  | 'manager'
  | 'relationship_manager'
  | 'employee'
  | 'connector'
  | 'banker'
  | 'accounts'
  | 'support';

export const EXTENDED_ROLES: ExtendedRole[] = [
  'super_admin',
  'manager',
  'relationship_manager',
  'employee',
  'connector',
  'banker',
  'accounts',
  'support',
];

export const EXTENDED_ROLE_LABELS: Record<ExtendedRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  relationship_manager: 'Relationship Manager',
  employee: 'Employee',
  connector: 'Connector',
  banker: 'Banker',
  accounts: 'Accounts',
  support: 'Support',
};

export const EXTENDED_ROLE_DESCRIPTIONS: Record<ExtendedRole, string> = {
  super_admin: 'Full platform access — every module, every action.',
  manager: 'Oversees Relationship Managers and Employees within their branch.',
  relationship_manager: 'Manages Employees and Connectors assigned to them; owns lead assignment within their team.',
  employee: 'Works assigned leads day to day; read-only elsewhere.',
  connector: 'Independent referral partner; submits and tracks their own leads and commission.',
  banker: 'Publishes bank criteria, reviews matched leads, manages documents for assigned cases.',
  accounts: 'Reconciles connector and affiliate commission, payouts and the accounting ledger.',
  support: 'Handles user-facing notifications and support queries; read access to platform activity.',
};

/** Roles that exist as an assignable `UserRole` in the live Users module today. */
export const ROLE_HAS_LIVE_USERS: Record<ExtendedRole, boolean> = {
  super_admin: true,
  manager: true,
  relationship_manager: true,
  employee: true,
  connector: true,
  banker: true,
  accounts: false,
  support: false,
};

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};

export interface PermissionModuleConfig {
  key: string;
  label: string;
  icon: string;
  route: string;
  actions: PermissionAction[];
}

/** Mirrors the nine sidebar sections of the Super Admin module. */
export const PERMISSION_MODULES: PermissionModuleConfig[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/super-admin/dashboard', actions: ['view'] },
  { key: 'users', label: 'Users', icon: 'manage_accounts', route: '/super-admin/users', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'leads', label: 'Leads', icon: 'assignment', route: '/super-admin/leads', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'banking', label: 'Banking', icon: 'account_balance', route: '/super-admin/banking', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'commissions', label: 'Commissions', icon: 'payments', route: '/super-admin/commissions', actions: ['view', 'create', 'edit'] },
  { key: 'reports', label: 'Reports', icon: 'bar_chart', route: '/super-admin/reports', actions: ['view'] },
  { key: 'notifications', label: 'Notifications', icon: 'notifications', route: '/super-admin/notifications', actions: ['view', 'edit'] },
  { key: 'audit_logs', label: 'Audit Logs', icon: 'history', route: '/super-admin/audit-logs', actions: ['view'] },
  { key: 'settings', label: 'Settings', icon: 'settings', route: '/super-admin/settings', actions: ['view', 'edit'] },
];
