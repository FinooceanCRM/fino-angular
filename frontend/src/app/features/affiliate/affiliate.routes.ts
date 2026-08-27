import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Affiliate workspace. Reachable only by the independent `affiliate` role. */
export const affiliateRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Affiliate dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['affiliate'] },
    loadComponent: () =>
      import('./dashboard/affiliate-dashboard.component').then(
        (m) => m.AffiliateDashboardComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Affiliate profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['affiliate'] },
    loadComponent: () =>
      import('./profile/affiliate-profile.component').then(
        (m) => m.AffiliateProfileComponent,
      ),
  },
  {
    path: 'referrals',
    title: 'My referrals — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['affiliate'] },
    loadComponent: () =>
      import('./referrals/affiliate-referrals.component').then(
        (m) => m.AffiliateReferralsComponent,
      ),
  },
  {
    path: 'commissions',
    title: 'My commissions — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['affiliate'] },
    loadComponent: () =>
      import('./commissions/affiliate-commissions.component').then(
        (m) => m.AffiliateCommissionsComponent,
      ),
  },
  {
    path: 'payouts',
    title: 'My payouts — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['affiliate'] },
    loadComponent: () =>
      import('./payouts/affiliate-payouts.component').then(
        (m) => m.AffiliatePayoutsComponent,
      ),
  },
];
