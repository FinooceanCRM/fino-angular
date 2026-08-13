import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Manager workspace. Reachable only by the `manager` role. */
export const managerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Manager dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./dashboard/manager-dashboard.component').then(
        (m) => m.ManagerDashboardComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Manager profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./profile/manager-profile.component').then(
        (m) => m.ManagerProfileComponent,
      ),
  },
  {
    path: 'relationship-managers',
    title: 'My Relationship Managers — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import(
        './relationship-managers/manager-relationship-managers.component'
      ).then((m) => m.ManagerRelationshipManagersComponent),
  },
  {
    path: 'employees',
    title: 'My employees — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./employees/manager-employees.component').then(
        (m) => m.ManagerEmployeesComponent,
      ),
  },
];
