import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Connector workspace. Reachable only by the independent `connector` role. */
export const connectorRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Connector dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['connector'] },
    loadComponent: () =>
      import('./dashboard/connector-dashboard.component').then(
        (m) => m.ConnectorDashboardComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Connector profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['connector'] },
    loadComponent: () =>
      import('./profile/connector-profile.component').then(
        (m) => m.ConnectorProfileComponent,
      ),
  },
  {
    path: 'leads/my-submitted',
    title: 'My submitted leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['connector'] },
    loadComponent: () =>
      import('./leads/my-submitted/connector-my-submitted-leads.component').then(
        (m) => m.ConnectorMySubmittedLeadsComponent,
      ),
  },
  {
    path: 'network',
    title: 'My network — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['connector'] },
    loadComponent: () =>
      import('./network/connector-network.component').then(
        (m) => m.ConnectorNetworkComponent,
      ),
  },
  {
    path: 'commissions',
    title: 'My commissions — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['connector'] },
    loadComponent: () =>
      import('./commissions/connector-commissions.component').then(
        (m) => m.ConnectorCommissionsComponent,
      ),
  },
  {
    path: 'payouts',
    title: 'My payouts — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['connector'] },
    loadComponent: () =>
      import('./payouts/connector-payouts.component').then(
        (m) => m.ConnectorPayoutsComponent,
      ),
  },
];
