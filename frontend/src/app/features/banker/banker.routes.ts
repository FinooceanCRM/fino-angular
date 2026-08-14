import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Banker workspace. */
export const bankerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Banker dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./dashboard/banker-dashboard.component').then((m) => m.BankerDashboardComponent),
  },
];
