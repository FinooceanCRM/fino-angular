import { Routes } from '@angular/router';

import { roleGuard } from '@core/guards/role.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    title: 'Dashboard — FINOOCEAN',
    loadComponent: () =>
      import('./dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'connector',
    title: 'Connector dashboard — FINOOCEAN',
    canActivate: [roleGuard],
    data: { roles: ['connector', 'super_admin'] },
    loadComponent: () =>
      import('./connector/connector-dashboard.component').then(
        (m) => m.ConnectorDashboardComponent,
      ),
  },
];
