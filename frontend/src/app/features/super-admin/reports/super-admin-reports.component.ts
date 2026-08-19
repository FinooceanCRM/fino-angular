import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';

interface ReportSection {
  icon: string;
  title: string;
  description: string;
  link: string;
}

/** Reports landing — four distinct report types, not variations of one list. */
@Component({
  selector: 'app-super-admin-reports',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, PageHeaderComponent],
  templateUrl: './super-admin-reports.component.html',
  styleUrl: './super-admin-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminReportsComponent {
  protected readonly sections: ReportSection[] = [
    {
      icon: 'assignment',
      title: 'Lead Reports',
      description: 'Volume, status mix and loan-type breakdown of the lead pipeline.',
      link: '/super-admin/reports/lead-reports',
    },
    {
      icon: 'groups',
      title: 'User Reports',
      description: 'Role mix, active vs. inactive split, and the new-signups trend.',
      link: '/super-admin/reports/user-reports',
    },
    {
      icon: 'trending_up',
      title: 'Performance Reports',
      description: 'Conversion funnel, team throughput and time-to-decision.',
      link: '/super-admin/reports/performance-reports',
    },
  ];
}
