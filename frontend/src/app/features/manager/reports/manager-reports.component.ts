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

/** Reports landing — five distinct report types, not variations of one list. */
@Component({
  selector: 'app-manager-reports',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, PageHeaderComponent],
  templateUrl: './manager-reports.component.html',
  styleUrl: './manager-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerReportsComponent {
  protected readonly sections: ReportSection[] = [
    {
      icon: 'assignment',
      title: 'Lead Reports',
      description: 'Volume, status mix and loan-type breakdown of your team\'s lead pipeline.',
      link: '/manager/reports/leads',
    },
    {
      icon: 'badge',
      title: 'Employee Reports',
      description: 'Leads handled, approved and disbursed, broken down by employee.',
      link: '/manager/reports/employees',
    },
    {
      icon: 'supervisor_account',
      title: 'RM Reports',
      description: 'The same breakdown, rolled up to each Relationship Manager.',
      link: '/manager/reports/relationship-managers',
    },
    {
      icon: 'account_balance',
      title: 'Banker Reports',
      description: 'Leads handled by the bankers engaged with your pipeline.',
      link: '/manager/reports/bankers',
    },
    {
      icon: 'trending_up',
      title: 'Performance Reports',
      description: 'Conversion funnel, team throughput and time-to-decision.',
      link: '/manager/reports/performance',
    },
  ];
}
