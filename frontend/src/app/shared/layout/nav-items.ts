import { AuthService } from '@core/services/auth.service';

export interface NavItem {
  label: string;
  link: string;
  icon: string;
}

/** Profile route for the signed-in user's role, mirroring the original toolbar's role switch. */
export function profileLink(auth: AuthService): string | null {
  if (auth.hasRole('connector')) return '/connector/profile';
  if (auth.hasRole('employee')) return '/employee/profile';
  if (auth.hasRole('relationship_manager')) return '/relationship-manager/profile';
  if (auth.hasRole('manager')) return '/manager/profile';
  return null;
}

/** Role-specific primary navigation, mirroring the original app.component role switch. */
export function roleNavItems(auth: AuthService): NavItem[] {
  const profile = profileLink(auth);
  const profileItem: NavItem[] = profile
    ? [{ label: 'Profile', link: profile, icon: 'person' }]
    : [];

  if (auth.hasRole('connector')) {
    return [
      { label: 'Connector dashboard', link: '/connector/dashboard', icon: 'dashboard' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('employee')) {
    return [
      { label: 'Employee dashboard', link: '/employee/dashboard', icon: 'dashboard' },
      ...profileItem,
      { label: 'My team', link: '/employee/team', icon: 'groups' },
    ];
  }

  if (auth.hasRole('relationship_manager')) {
    return [
      { label: 'RM dashboard', link: '/relationship-manager/dashboard', icon: 'dashboard' },
      { label: 'Employees', link: '/relationship-manager/employees', icon: 'groups' },
      { label: 'Connectors', link: '/relationship-manager/connectors', icon: 'hub' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('manager')) {
    return [
      { label: 'Manager dashboard', link: '/manager/dashboard', icon: 'dashboard' },
      {
        label: 'Relationship Managers',
        link: '/manager/relationship-managers',
        icon: 'supervisor_account',
      },
      { label: 'Employees', link: '/manager/employees', icon: 'groups' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('super_admin')) {
    return [{ label: 'Super Admin dashboard', link: '/super-admin/dashboard', icon: 'dashboard' }];
  }

  if (auth.hasRole('banker')) {
    return [{ label: 'Banker dashboard', link: '/banker/dashboard', icon: 'dashboard' }];
  }

  return [{ label: 'Dashboard', link: '/dashboard', icon: 'dashboard' }];
}

/** Loan management workspace (Phase 9), shared by every authenticated role. */
export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { label: 'Leads', link: '/leads', icon: 'assignment' },
  { label: 'Banks', link: '/banks', icon: 'account_balance' },
  { label: 'Documents', link: '/documents', icon: 'description' },
  { label: 'Reports', link: '/reports', icon: 'bar_chart' },
  { label: 'Notifications', link: '/notifications', icon: 'notifications' },
];
