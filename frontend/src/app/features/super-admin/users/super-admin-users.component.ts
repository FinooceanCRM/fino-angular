import { ChangeDetectionStrategy, Component } from '@angular/core';

import { OverviewGridComponent, OverviewGridSection } from '@shared/components/overview-grid.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/** Users module landing — one card per role bucket, same pattern as the Commissions landing. */
@Component({
  selector: 'app-super-admin-users',
  standalone: true,
  imports: [PageHeaderComponent, OverviewGridComponent],
  templateUrl: './super-admin-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminUsersComponent {
  protected readonly sections: OverviewGridSection[] = [
    {
      icon: 'supervisor_account',
      title: 'Managers',
      description: 'Top of the reporting hierarchy — each owns a set of Relationship Managers.',
      link: '/super-admin/users/managers',
    },
    {
      icon: 'support_agent',
      title: 'Relationship Managers',
      description: 'Own a department (PL/HL/ML) and a team of Employees.',
      link: '/super-admin/users/relationship-managers',
    },
    {
      icon: 'badge',
      title: 'Employees',
      description: 'Leaf of the reporting hierarchy, assigned under a Relationship Manager.',
      link: '/super-admin/users/employees',
    },
    {
      icon: 'hub',
      title: 'Connectors',
      description: 'Self-registered referral partners with an invite network — manage commission rates and suspend accounts.',
      link: '/super-admin/users/connectors',
    },
    {
      icon: 'account_balance',
      title: 'Bankers',
      description: 'Bank-side users matching and processing leads against their own criteria.',
      link: '/super-admin/users/bankers',
    },
    {
      icon: 'campaign',
      title: 'Affiliates',
      description: 'Self-registered referral partners — manage commission rates and suspend accounts.',
      link: '/super-admin/users/affiliates',
    },
    {
      icon: 'admin_panel_settings',
      title: 'Roles & Permissions',
      description: 'The eight-role system — see module access at a glance and manage the permission matrix.',
      link: '/super-admin/users/roles',
    },
  ];
}
