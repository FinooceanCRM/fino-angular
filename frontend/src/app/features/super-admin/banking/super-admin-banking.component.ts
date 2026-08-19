import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';

interface BankingSection {
  icon: string;
  title: string;
  description: string;
  link: string;
}

/** Banking module landing — three distinct tools, not variations of one list. */
@Component({
  selector: 'app-super-admin-banking',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, PageHeaderComponent],
  templateUrl: './super-admin-banking.component.html',
  styleUrl: './super-admin-banking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminBankingComponent {
  protected readonly sections: BankingSection[] = [
    {
      icon: 'account_balance',
      title: 'Bank Criteria',
      description: 'Manage the bank products the matching engine evaluates leads against.',
      link: '/super-admin/banking/bank-criteria',
    },
    {
      icon: 'bolt',
      title: 'Matching Engine',
      description: 'Run a lead against every active bank product and see the eligible matches.',
      link: '/super-admin/banking/matching-engine',
    },
    {
      icon: 'assignment_ind',
      title: 'Assigned Leads',
      description: 'Assign or reassign the banker responsible for a lead.',
      link: '/super-admin/banking/assigned-leads',
    },
  ];
}
