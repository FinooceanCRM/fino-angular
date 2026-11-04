/**
 * The page hierarchy behind every breadcrumb and Back button.
 *
 * Most pages need no entry here: a URL such as `/leads/12/timeline` is understood segment by segment
 * (Home › Leads › #12 › Timeline). An entry is only needed when
 *   - the page is a *sibling* route of its parent (e.g. `/account/applications/:id` is not nested under
 *     `/account/applications`, so Angular's route tree cannot tell that "My Applications" is its parent), or
 *   - the automatic label is not good enough (a route parameter, or a word that reads badly).
 *
 * `:name` matches any single segment. For a brand-new module that has no entry, set the same hints on the route:
 *   `data: { breadcrumb: 'Invoice', parentRoute: '/billing/invoices', fallbackRoute: '/billing' }`.
 */
export interface NavNode {
  /** Text of the crumb and of "Back to …". */
  label: string;
  /** URL of the page one level up. Omit for a root page. */
  parent?: string;
}

/** Where a page with no known parent and no browser history falls back to. */
export const CUSTOMER_HOME = '/account';
export const STAFF_HOME = '/dashboard';

const STAFF_ROLES = ['manager', 'employee', 'relationship-manager', 'telecaller', 'super-admin'] as const;

/** Top-level segments that only select a role's workspace; they are never a crumb. */
export const ROLE_SEGMENTS = new Set<string>([
  'connector', 'vendor', 'affiliate', 'employee', 'relationship-manager', 'manager', 'super-admin', 'banker', 'telecaller',
]);

const nodes: Record<string, NavNode> = {
  // ── Customer portal: the Dashboard is /account, every card opens a page one level below it ──
  '/account': { label: 'Dashboard' },
  '/account/applications': { label: 'My Applications', parent: '/account' },
  '/account/applications/:id': { label: 'Application Details', parent: '/account/applications' },
  '/account/apply': { label: 'Apply for a Loan', parent: '/account' },
  '/account/calculator': { label: 'EMI Calculator', parent: '/account' },
  '/account/documents': { label: 'My Documents', parent: '/account' },
  '/account/notifications': { label: 'Notifications', parent: '/account' },
  '/account/offers': { label: 'Offers for Me', parent: '/account' },
  '/account/settings': { label: 'Account Settings', parent: '/account' },
  '/account/help': { label: 'Support', parent: '/account' },
  '/account/profile': { label: 'Profile', parent: '/account' },
  '/account/profile/overview': { label: 'KYC & Profile Overview', parent: '/account/profile' },
  '/account/profile/kyc': { label: 'KYC Verification', parent: '/account/profile' },
  '/account/profile/bank': { label: 'Bank Details', parent: '/account/profile' },
  '/account/profile/payments': { label: 'UPI & Payment Methods', parent: '/account/profile' },
  '/account/profile/communication': { label: 'Communication Preferences', parent: '/account/profile' },
  '/account/profile/security': { label: 'Password & Security', parent: '/account/profile' },
  '/account/profile/delete': { label: 'Delete Account', parent: '/account/profile' },

  // ── Shared staff modules ──
  '/inquiries': { label: 'Customer Inquiries' },
  '/inquiries/routing': { label: 'Routing Rules', parent: '/inquiries' },
  '/inquiries/:id': { label: 'Inquiry Details', parent: '/inquiries' },
  '/leads': { label: 'Leads' },
  '/leads/create': { label: 'New Lead', parent: '/leads' },
  '/leads/:id': { label: 'Lead Details', parent: '/leads' },
  '/leads/:id/edit': { label: 'Edit Lead', parent: '/leads/:id' },
  '/leads/:id/pd': { label: 'Pre-disbursement Verification', parent: '/leads/:id' },
  '/customers': { label: 'Customers' },
  '/customers/:id': { label: 'Customer Profile', parent: '/customers' },
  '/users': { label: 'Users' },
  '/users/create': { label: 'New User', parent: '/users' },
  '/users/:id': { label: 'User Details', parent: '/users' },
  '/users/:id/edit': { label: 'Edit User', parent: '/users/:id' },
  '/super-admin/audit-logs': { label: 'Audit Logs' },
  '/super-admin/audit-logs/:id': { label: 'Audit Log Details', parent: '/super-admin/audit-logs' },
  '/telecaller/verification': { label: 'Verification Desk' },
  '/manager/employees': { label: 'Employees' },
  '/manager/employees/:id': { label: 'Employee Details', parent: '/manager/employees' },
  '/manager/relationship-managers': { label: 'Relationship Managers' },
  '/manager/relationship-managers/:id': { label: 'Relationship Manager Details', parent: '/manager/relationship-managers' },
};

// Lead pages exist under every role's workspace with the same shape.
for (const role of STAFF_ROLES) {
  nodes[`/${role}/leads`] ??= { label: 'Leads' };
  nodes[`/${role}/leads/:id`] = { label: 'Lead Details', parent: `/${role}/leads` };
  nodes[`/${role}/leads/:id/timeline`] = { label: 'Timeline', parent: `/${role}/leads/:id` };
  nodes[`/${role}/leads/:id/assign`] = { label: 'Assign Lead', parent: `/${role}/leads/:id` };
}

export const NAV_NODES: Readonly<Record<string, NavNode>> = nodes;
