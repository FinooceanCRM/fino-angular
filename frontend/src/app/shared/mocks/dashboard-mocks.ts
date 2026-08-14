import { UserRole } from '@core/models/user.model';
import { ActivityItem } from '@shared/components/recent-activity.component';
import { QuickAction } from '@shared/components/quick-actions.component';
import { StatCardAccent } from '@shared/components/stat-card.component';

export interface MockStat {
  icon: string;
  value: string | number;
  label: string;
  accent: StatCardAccent;
}

/**
 * Static "recent activity" content for the dashboards.
 *
 * There is no activity-feed API in the backend yet, and this UI pass is not
 * connecting one — these entries are illustrative placeholders, timestamped
 * relative to now, until a real activity feed is wired up.
 */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const ACTIVITY_BY_ROLE: Record<UserRole, ActivityItem[]> = {
  super_admin: [
    { icon: 'person_add', title: 'New Manager account created', description: 'Priya Sharma — North region', timestamp: hoursAgo(2) },
    { icon: 'security', title: 'Permission set updated', description: 'users.update granted to Relationship Manager role', timestamp: hoursAgo(6) },
    { icon: 'account_balance', title: 'New bank criteria published', description: 'HDFC Bank — Home Loan Plus', timestamp: hoursAgo(20) },
    { icon: 'assignment_turned_in', title: 'Monthly report generated', description: 'Portfolio summary — all branches', timestamp: hoursAgo(30) },
  ],
  manager: [
    { icon: 'person_add', title: 'New employee onboarded', description: 'Assigned to Relationship Manager Arjun Mehta', timestamp: hoursAgo(3) },
    { icon: 'assignment', title: 'Lead escalated for review', description: 'Reference LN-2291 — high loan amount', timestamp: hoursAgo(9) },
    { icon: 'supervisor_account', title: 'Relationship Manager reassigned', description: 'Branch transfer — Pune to Mumbai', timestamp: hoursAgo(18) },
    { icon: 'bar_chart', title: 'Weekly performance report ready', timestamp: hoursAgo(26) },
  ],
  relationship_manager: [
    { icon: 'assignment', title: 'Lead status changed to Approved', description: 'Reference LN-2287', timestamp: hoursAgo(1) },
    { icon: 'groups', title: 'Employee added to your team', description: 'Rahul Verma', timestamp: hoursAgo(5) },
    { icon: 'hub', title: 'New connector assigned', description: 'Sunrise Financial Services', timestamp: hoursAgo(14) },
    { icon: 'description', title: 'Document verified', description: 'KYC documents — reference LN-2270', timestamp: hoursAgo(22) },
  ],
  employee: [
    { icon: 'assignment_ind', title: 'Lead assigned to you', description: 'Reference LN-2299', timestamp: hoursAgo(1) },
    { icon: 'upload_file', title: 'Document uploaded', description: 'Income proof — reference LN-2281', timestamp: hoursAgo(7) },
    { icon: 'check_circle', title: 'Lead moved to Documentation', description: 'Reference LN-2265', timestamp: hoursAgo(16) },
    { icon: 'event', title: 'Follow-up reminder', description: 'Call applicant — reference LN-2250', timestamp: hoursAgo(24) },
  ],
  connector: [
    { icon: 'assignment', title: 'Lead submitted', description: 'Reference LN-2302', timestamp: hoursAgo(2) },
    { icon: 'thumb_up', title: 'Lead approved', description: 'Reference LN-2288', timestamp: hoursAgo(11) },
    { icon: 'payments', title: 'Payout processed', description: 'Commission for reference LN-2240', timestamp: hoursAgo(28) },
    { icon: 'badge', title: 'Profile verified', timestamp: hoursAgo(40) },
  ],
  banker: [
    { icon: 'fact_check', title: 'Lead matched to your criteria', description: 'Reference LN-2295 — Home Loan', timestamp: hoursAgo(2) },
    { icon: 'rule', title: 'Eligibility criteria updated', description: 'Personal Loan — min credit score raised', timestamp: hoursAgo(10) },
    { icon: 'description', title: 'Document set received', description: 'Reference LN-2276', timestamp: hoursAgo(19) },
    { icon: 'trending_up', title: 'Monthly disbursal target updated', timestamp: hoursAgo(32) },
  ],
};

export function recentActivityForRole(role: UserRole): ActivityItem[] {
  return ACTIVITY_BY_ROLE[role];
}

/** Super Admin has no dedicated backend dashboard endpoint yet — fully mocked. */
export const SUPER_ADMIN_STATS: MockStat[] = [
  { icon: 'groups', value: 128, label: 'Total users', accent: 'primary' },
  { icon: 'admin_panel_settings', value: 6, label: 'Managers', accent: 'default' },
  { icon: 'assignment', value: 342, label: 'Active leads', accent: 'accent' },
  { icon: 'account_balance', value: 14, label: 'Partner banks', accent: 'default' },
];

export const SUPER_ADMIN_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Leads', route: '/leads', icon: 'assignment' },
  { label: 'Banks', route: '/banks', icon: 'account_balance' },
  { label: 'Reports', route: '/reports', icon: 'bar_chart' },
  { label: 'Documents', route: '/documents', icon: 'description' },
];

/** Banker has no dedicated backend dashboard endpoint yet — fully mocked. */
export const BANKER_STATS: MockStat[] = [
  { icon: 'fact_check', value: 47, label: 'Matched leads', accent: 'primary' },
  { icon: 'pending_actions', value: 12, label: 'Pending review', accent: 'accent' },
  { icon: 'rule', value: 8, label: 'Active criteria sets', accent: 'default' },
  { icon: 'payments', value: '₹2.4Cr', label: 'Disbursed this month', accent: 'default' },
];

export const BANKER_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Leads', route: '/leads', icon: 'assignment' },
  { label: 'Banks', route: '/banks', icon: 'account_balance' },
  { label: 'Documents', route: '/documents', icon: 'description' },
  { label: 'Reports', route: '/reports', icon: 'bar_chart' },
];

/**
 * Employee and Connector dashboards have no per-user lead counts in the
 * backend response yet — these statistic tiles are illustrative mock data.
 */
export const EMPLOYEE_STATS: MockStat[] = [
  { icon: 'assignment_ind', value: 9, label: 'Leads assigned', accent: 'primary' },
  { icon: 'pending_actions', value: 3, label: 'Pending documents', accent: 'accent' },
  { icon: 'check_circle', value: 21, label: 'Approved this month', accent: 'default' },
];

export const CONNECTOR_STATS: MockStat[] = [
  { icon: 'assignment', value: 15, label: 'Leads submitted', accent: 'primary' },
  { icon: 'thumb_up', value: 6, label: 'Approved this month', accent: 'accent' },
  { icon: 'payments', value: '₹42,000', label: 'Commission earned', accent: 'default' },
];
