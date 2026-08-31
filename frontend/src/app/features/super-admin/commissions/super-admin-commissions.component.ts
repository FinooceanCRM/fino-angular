import { ChangeDetectionStrategy, Component } from '@angular/core';

import { OverviewGridComponent, OverviewGridSection } from '@shared/components/overview-grid.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/** Commission module landing — four distinct ledgers, not variations of one list. */
@Component({
  selector: 'app-super-admin-commissions',
  standalone: true,
  imports: [PageHeaderComponent, OverviewGridComponent],
  templateUrl: './super-admin-commissions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminCommissionsComponent {
  protected readonly sections: OverviewGridSection[] = [
    {
      icon: 'hub',
      title: 'Connector Commission',
      description: 'Commission earned by connectors on leads they referred.',
      link: '/super-admin/commissions/connector-commission',
    },
    {
      icon: 'campaign',
      title: 'Affiliate Commission',
      description: 'Referral partners outside the connector hierarchy.',
      link: '/super-admin/commissions/affiliate-commission',
    },
    {
      icon: 'receipt_long',
      title: 'Payouts',
      description: 'The payout queue and payment history for every payee.',
      link: '/super-admin/commissions/payouts',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Accounting',
      description: 'The commission-liability ledger — accrued, paid and outstanding.',
      link: '/super-admin/commissions/accounting',
    },
  ];
}
