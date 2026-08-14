import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Super Admin workspace. */
export const superAdminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Super Admin dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./dashboard/super-admin-dashboard.component').then(
        (m) => m.SuperAdminDashboardComponent,
      ),
  },
];
