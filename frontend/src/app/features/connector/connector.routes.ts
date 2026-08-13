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
];
