import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';

interface ReportTab {
  label: string;
  link: string;
}

/**
 * Shared "Reports" header + tab strip shown at the top of the Lead Reports
 * page (the reports landing/overview) — matches the Tidewater mockup's tab
 * row across Lead/Performance/Commission/User reports. Each tab is a real
 * route (mat-tab-nav-bar), so clicking one navigates to that report's own
 * dedicated page rather than swapping content in place — those destination
 * pages render their own page-specific header and don't repeat this strip,
 * matching the approved mockups (the standalone User Reports mockup has no
 * tab row of its own).
 */
@Component({
  selector: 'app-super-admin-reports-tabs',
  standalone: true,
  imports: [MatTabsModule, RouterLink, RouterLinkActive, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Reports"
      subtitle="Platform performance across leads, banks and teams"
      icon="bar_chart"
    />

    <nav mat-tab-nav-bar class="reports-tabs" [tabPanel]="tabPanel">
      @for (tab of tabs; track tab.link) {
        <a
          mat-tab-link
          [routerLink]="tab.link"
          routerLinkActive
          #rla="routerLinkActive"
          [active]="rla.isActive"
        >
          {{ tab.label }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #tabPanel />
  `,
  styles: [
    `
      .reports-tabs {
        margin-bottom: var(--app-space-4);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
    `,
  ],
})
export class SuperAdminReportsTabsComponent {
  protected readonly tabs: ReportTab[] = [
    { label: 'Lead Reports', link: '/super-admin/reports/lead-reports' },
    { label: 'Performance', link: '/super-admin/reports/performance-reports' },
    { label: 'Commission Reports', link: '/super-admin/reports/commission-reports' },
    { label: 'User Reports', link: '/super-admin/reports/user-reports' },
  ];
}
