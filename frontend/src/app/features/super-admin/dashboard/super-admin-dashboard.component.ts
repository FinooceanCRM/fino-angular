import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

import { DashboardHeroComponent } from '@shared/components/dashboard-hero.component';
import { StatCardAccent, StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { LEAD_STATUS_CATALOGUE } from '../data/models/lead.model';
import { SuperAdminNotificationDropdownComponent } from '../notifications/notification-dropdown/super-admin-notification-dropdown.component';
import { bucketByMonth } from '../data/report-date-range.util';
import { AuditLogDataProvider } from '../data/providers/audit-log-data.provider';
import { CommissionDataProvider } from '../data/providers/commission-data.provider';
import { LeadDataProvider } from '../data/providers/lead-data.provider';
import { UserDataProvider } from '../data/providers/user-data.provider';

const MOCK_TODAY = new Date('2026-08-15T10:00:00+05:30');

interface KpiTile {
  icon: string;
  value: string | number;
  label: string;
  trend?: string;
  accent: StatCardAccent;
}

interface StatusBar {
  label: string;
  count: number;
  percent: number;
  colour: StatusPillColour;
}

interface MonthBar {
  label: string;
  value: number;
  percent: number;
}

interface TrendPoint {
  x: number;
  y: number;
  label: string;
  value: string;
}

interface RecentLeadRow {
  reference: string;
  applicant: string;
  loanType: string;
  amount: string;
  status: string;
  statusColour: StatusPillColour;
  date: string;
}

const ENTITY_ICON: Record<string, string> = {
  User: 'person',
  Lead: 'track_changes',
  'Bank Criteria': 'account_balance',
  Payout: 'payments',
  'Banker Assignment': 'assignment_ind',
  Commission: 'payments',
  Settings: 'settings',
  Auth: 'login',
  Document: 'description',
  'Matching Engine': 'bolt',
  Report: 'bar_chart',
  Permission: 'admin_panel_settings',
};

function isSameCalendarDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

/**
 * Super Admin dashboard — every figure here is derived from the centralized
 * data providers (Users, Leads, Banking, Commissions, Audit Logs). Nothing
 * is hard-coded; a mutation made on any other page (create a user, mark a
 * payout paid, deactivate a bank product) shows up here on next render.
 */
@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    DashboardHeroComponent,
    StatCardComponent,
    StatusPillComponent,
    SuperAdminNotificationDropdownComponent,
    TimelineComponent,
  ],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminDashboardComponent {
  private readonly userData = inject(UserDataProvider);
  private readonly leadData = inject(LeadDataProvider);
  private readonly commissionData = inject(CommissionDataProvider);
  private readonly auditLogData = inject(AuditLogDataProvider);

  protected readonly asOfLabel = MOCK_TODAY.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  private activeCountByRole(role: string): number {
    return this.userData.users().filter((user) => user.role === role && user.is_active).length;
  }

  protected readonly kpis = computed<KpiTile[]>(() => {
    const leads = this.leadData.leads();
    const todayCount = leads.filter((lead) => lead.created_at && isSameCalendarDay(lead.created_at, MOCK_TODAY)).length;
    const yesterday = new Date(MOCK_TODAY);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayCount = leads.filter((lead) => lead.created_at && isSameCalendarDay(lead.created_at, yesterday)).length;
    const todayTrend =
      todayCount === yesterdayCount ? undefined : `${todayCount >= yesterdayCount ? '↑' : '↓'} ${Math.abs(todayCount - yesterdayCount)} vs yesterday`;

    const totalCommission =
      this.commissionData.connectors().reduce((sum, row) => sum + (row.commission_accrued ?? 0), 0) +
      this.commissionData.affiliates().reduce((sum, row) => sum + (row.commission_accrued ?? 0), 0);

    const monthlyAccrued = bucketByMonth(
      this.commissionData.ledger().filter((e) => e.type === 'connector_commission_accrued' || e.type === 'affiliate_commission_accrued'),
      (entry) => entry.date,
      2,
      (entries) => entries.reduce((sum, entry) => sum + (entry.credit ?? 0), 0),
    );
    const [lastMonth, thisMonth] = monthlyAccrued;
    const commissionTrend =
      lastMonth && lastMonth.value > 0
        ? `${thisMonth.value >= lastMonth.value ? '↑' : '↓'} ${Math.round((Math.abs(thisMonth.value - lastMonth.value) / lastMonth.value) * 100)}% vs last month`
        : undefined;

    return [
      { icon: 'assignment', value: leads.length, label: 'Total Leads', accent: 'primary' },
      { icon: 'today', value: todayCount, label: "Today's Leads", trend: todayTrend, accent: 'accent' },
      { icon: 'account_balance', value: this.activeCountByRole('banker'), label: 'Active Bankers', accent: 'default' },
      { icon: 'badge', value: this.activeCountByRole('employee'), label: 'Active Employees', accent: 'default' },
      { icon: 'hub', value: this.activeCountByRole('connector'), label: 'Active Connectors', accent: 'default' },
      { icon: 'task_alt', value: leads.filter((l) => l.status === 'approved').length, label: 'Approved Loans', accent: 'accent' },
      { icon: 'paid', value: leads.filter((l) => l.status === 'disbursed').length, label: 'Disbursed Loans', accent: 'accent' },
      {
        icon: 'payments',
        value: '₹' + (totalCommission / 100000).toFixed(1) + 'L',
        label: 'Total Commission',
        trend: commissionTrend,
        accent: 'primary',
      },
    ];
  });

  protected readonly statusBreakdown = computed<StatusBar[]>(() => {
    const leads = this.leadData.leads();
    const max = Math.max(1, ...LEAD_STATUS_CATALOGUE.map((s) => leads.filter((l) => l.status === s.value).length));

    return LEAD_STATUS_CATALOGUE.map((status) => {
      const count = leads.filter((l) => l.status === status.value).length;
      return {
        label: status.label,
        count,
        percent: Math.round((count / max) * 100),
        colour: (status.colour ?? 'default') as StatusPillColour,
      };
    }).filter((row) => row.count > 0);
  });

  protected readonly loansByMonth = computed<MonthBar[]>(() => {
    const buckets = bucketByMonth(this.leadData.leads(), (lead) => lead.created_at, 6);
    const max = Math.max(1, ...buckets.map((b) => b.value));
    return buckets.map((b) => ({ label: b.label, value: b.value, percent: Math.round((b.value / max) * 100) }));
  });

  private readonly commissionMonthly = computed(() =>
    bucketByMonth(
      this.commissionData.ledger().filter((e) => e.type === 'connector_commission_accrued' || e.type === 'affiliate_commission_accrued'),
      (entry) => entry.date,
      6,
      (entries) => entries.reduce((sum, entry) => sum + (entry.credit ?? 0), 0),
    ),
  );

  protected readonly commissionPoints = computed<TrendPoint[]>(() => {
    const buckets = this.commissionMonthly();
    if (buckets.length === 0) {
      return [];
    }
    const values = buckets.map((b) => b.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const width = 320;
    const margin = 10;
    const top = 12;
    const bottom = 108;
    const step = buckets.length > 1 ? (width - margin * 2) / (buckets.length - 1) : 0;

    return buckets.map((bucket, index) => ({
      x: margin + index * step,
      y: bottom - ((bucket.value - min) / range) * (bottom - top),
      label: bucket.label,
      value: '₹' + (bucket.value / 100000).toFixed(1) + 'L',
    }));
  });

  protected readonly commissionLinePath = computed(() =>
    this.commissionPoints()
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' '),
  );

  protected readonly commissionAreaPath = computed(() => {
    const points = this.commissionPoints();
    if (points.length === 0) {
      return '';
    }
    const first = points[0];
    const last = points[points.length - 1];
    return `${this.commissionLinePath()} L${last.x},116 L${first.x},116 Z`;
  });

  protected readonly recentLeads = computed<RecentLeadRow[]>(() =>
    [...this.leadData.leads()]
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 6)
      .map((lead) => ({
        reference: lead.reference,
        applicant: lead.applicant_name,
        loanType: lead.loan_type,
        amount: lead.loan_amount.toLocaleString('en-IN'),
        status: lead.status_label,
        statusColour: lead.status_colour as StatusPillColour,
        date: new Date(lead.created_at ?? 0).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      })),
  );

  protected readonly recentActivities = computed<TimelineEntry[]>(() =>
    [...this.auditLogData.entries()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map((entry) => ({
        icon: ENTITY_ICON[entry.entity_type] ?? 'track_changes',
        title: `${entry.entity_type} ${entry.action}`,
        subtitle: `${entry.entity_label} — ${entry.description}`,
        time: this.relativeTime(entry.timestamp),
      })),
  );

  private relativeTime(iso: string): string {
    const minutes = Math.round((MOCK_TODAY.getTime() - new Date(iso).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}
