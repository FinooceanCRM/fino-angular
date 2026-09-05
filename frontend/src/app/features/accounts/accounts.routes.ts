import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/**
 * Accounts workspace — finance/reconciliation staff (see AccountsService).
 * Independent of the reporting hierarchy, like Connector/Banker/Telecaller.
 *
 * The Connector Commission, Affiliate Commission, Payouts and Ledger pages
 * are the exact same standalone components the Super Admin Commissions
 * module already uses (see `@features/super-admin/commissions`) — they have
 * no super-admin-specific coupling (no hardcoded routerLinks, no role
 * checks), and the backend routes they call (`super-admin/connectors`,
 * `super-admin/affiliates`, `super-admin/ledger`) already accept the
 * `accounts` role alongside `super_admin` (see routes/api.php), so reusing
 * them here keeps one implementation instead of a duplicate.
 */
export const accountsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Accounts dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import('./dashboard/accounts-dashboard.component').then((m) => m.AccountsDashboardComponent),
  },
  {
    path: 'disbursements',
    title: 'Disbursements — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import('./disbursements/accounts-disbursements.component').then(
        (m) => m.AccountsDisbursementsComponent,
      ),
  },
  {
    path: 'connector-commission',
    title: 'Connector Commission — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import(
        '@features/super-admin/commissions/connector-commission/super-admin-connector-commission.component'
      ).then((m) => m.SuperAdminConnectorCommissionComponent),
  },
  {
    path: 'affiliate-commission',
    title: 'Affiliate Commission — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import(
        '@features/super-admin/commissions/affiliate-commission/super-admin-affiliate-commission.component'
      ).then((m) => m.SuperAdminAffiliateCommissionComponent),
  },
  {
    path: 'payouts',
    title: 'Payouts — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import('@features/super-admin/commissions/payouts/super-admin-payouts.component').then(
        (m) => m.SuperAdminPayoutsComponent,
      ),
  },
  {
    path: 'ledger',
    title: 'Accounting Ledger — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import('@features/super-admin/commissions/accounting/super-admin-accounting.component').then(
        (m) => m.SuperAdminAccountingComponent,
      ),
  },
  {
    path: 'reports',
    title: 'Commission Reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import(
        '@features/super-admin/reports/commission-reports/super-admin-commission-reports.component'
      ).then((m) => m.SuperAdminCommissionReportsComponent),
  },
  {
    path: 'profile',
    title: 'Accounts profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['accounts'] },
    loadComponent: () =>
      import('./profile/accounts-profile.component').then((m) => m.AccountsProfileComponent),
  },
];
