import { AuthService } from '@core/services/auth.service';

export interface NavItem {
  label: string;
  link: string;
  icon: string;
}

/** Profile route for the signed-in user's role, mirroring the original toolbar's role switch. */
export function profileLink(auth: AuthService): string | null {
  if (auth.hasRole('connector')) return '/connector/profile';
  if (auth.hasRole('affiliate')) return '/affiliate/profile';
  if (auth.hasRole('banker')) return '/banker/profile';
  if (auth.hasRole('telecaller')) return '/telecaller/profile';
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
      { label: 'My Submitted Leads', link: '/connector/leads/my-submitted', icon: 'link' },
      { label: 'My network', link: '/connector/network', icon: 'hub' },
      { label: 'Commissions', link: '/connector/commissions', icon: 'payments' },
      { label: 'Payouts', link: '/connector/payouts', icon: 'account_balance_wallet' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('affiliate')) {
    return [
      { label: 'Affiliate dashboard', link: '/affiliate/dashboard', icon: 'dashboard' },
      { label: 'Referrals', link: '/affiliate/referrals', icon: 'groups' },
      { label: 'Commissions', link: '/affiliate/commissions', icon: 'payments' },
      { label: 'Payouts', link: '/affiliate/payouts', icon: 'account_balance_wallet' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('employee')) {
    return [
      { label: 'Employee dashboard', link: '/employee/dashboard', icon: 'dashboard' },
      { label: 'My Leads', link: '/employee/leads', icon: 'assignment_ind' },
      { label: 'My Submitted Leads', link: '/employee/leads/my-submitted', icon: 'link' },
      ...profileItem,
      { label: 'My team', link: '/employee/team', icon: 'groups' },
    ];
  }

  if (auth.hasRole('relationship_manager')) {
    return [
      { label: 'RM dashboard', link: '/relationship-manager/dashboard', icon: 'dashboard' },
      { label: 'Employees', link: '/relationship-manager/employees', icon: 'groups' },
      { label: 'My Submitted Leads', link: '/relationship-manager/leads/my-submitted', icon: 'link' },
      // KYC Verification (Phase 5, Part B) — real Document feature, scoped
      // to this RM's own leads.
      { label: 'KYC verification', link: '/relationship-manager/kyc', icon: 'fact_check' },
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
      { label: 'My Submitted Leads', link: '/manager/leads/my-submitted', icon: 'link' },
      // Bankers' "Send Request" / "Request Full Details" access requests
      // land here for approval — the Access approvals tab is the real,
      // API-backed one (the other Approval Center tabs are still mock data).
      { label: 'Approvals', link: '/manager/approvals', icon: 'fact_check' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('super_admin')) {
    return [
      { label: 'Super Admin dashboard', link: '/super-admin/dashboard', icon: 'dashboard' },
      // Bankers' "Request Full Details" access requests land here for
      // approval — same real, API-backed workflow as the Manager's
      // "Access approvals" tab (see manager.routes.ts `approvals`).
      { label: 'Approvals', link: '/super-admin/approvals', icon: 'fact_check' },
      // Real backend feature since Phase 0 (see AuditLogController /
      // AuditLogService) — the platform-wide audit trail.
      { label: 'Audit Logs', link: '/super-admin/audit-logs', icon: 'history' },
      // Real backend feature since Phase 1 (see SettingsController /
      // SettingsService) — the singleton platform settings document.
      { label: 'Settings', link: '/super-admin/settings', icon: 'settings' },
    ];
  }

  if (auth.hasRole('banker')) {
    return [
      { label: 'Banker dashboard', link: '/banker/dashboard', icon: 'dashboard' },
      // The four lead buckets (Matched/Priority/Assigned/My Submitted) live
      // under this one entry via the bucket-nav strip on the page itself —
      // access requests are now an action inside those buckets, not a
      // separate nav item (see banker-lead-view-dialog + Request Full
      // Details).
      { label: 'My Leads', link: '/banker/leads', icon: 'assignment_ind' },
      { label: 'Bank Criteria', link: '/banker/criteria', icon: 'rule' },
      ...profileItem,
    ];
  }

  if (auth.hasRole('telecaller')) {
    return [
      { label: 'Telecaller dashboard', link: '/telecaller/dashboard', icon: 'dashboard' },
      { label: 'My Submitted Leads', link: '/telecaller/leads', icon: 'assignment_ind' },
      { label: 'PD Queue', link: '/telecaller/leads/pd-queue', icon: 'call' },
      { label: 'Follow-ups', link: '/telecaller/follow-ups', icon: 'event_repeat' },
      ...profileItem,
    ];
  }

  return [{ label: 'Dashboard', link: '/dashboard', icon: 'dashboard' }];
}

/** Loan management workspace (Phase 9), shared by every authenticated role. */
export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { label: 'Leads', link: '/leads', icon: 'assignment' },
  // Tasks (Phase 4) — shared by every authenticated role.
  { label: 'Tasks', link: '/tasks', icon: 'checklist' },
  { label: 'Banks', link: '/banks', icon: 'account_balance' },
  { label: 'Documents', link: '/documents', icon: 'description' },
  { label: 'Reports', link: '/reports', icon: 'bar_chart' },
  { label: 'Notifications', link: '/notifications', icon: 'notifications' },
];

/**
 * Adds "Users" to the shared workspace items for roles with users.view; drops
 * "Leads" for Bankers, who already have "My Leads" in their own section; and
 * drops "Documents" and "Reports" for Connectors and Affiliates, who both
 * lose document access on a lead the moment it's submitted (see
 * lead-detail.component.ts `isConnector`) and do not use the reporting
 * workspace — Affiliates get the same treatment as their closest analog,
 * Connector, having their own dedicated "Referrals" list instead.
 */
export function workspaceNavItems(auth: AuthService): NavItem[] {
  let items = WORKSPACE_NAV_ITEMS;

  if (auth.hasRole('banker')) {
    items = items.filter((item) => item.link !== '/leads');
  }

  if (auth.hasRole('connector') || auth.hasRole('affiliate')) {
    items = items.filter((item) => item.link !== '/documents' && item.link !== '/reports');
  }

  if (!auth.can('users.view')) {
    return items;
  }

  return [...items, { label: 'Users', link: '/users', icon: 'manage_accounts' }];
}
