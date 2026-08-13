import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Employee workspace. Reachable only by the `employee` role. */
export const employeeRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Employee dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./dashboard/employee-dashboard.component').then(
        (m) => m.EmployeeDashboardComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Employee profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./profile/employee-profile.component').then(
        (m) => m.EmployeeProfileComponent,
      ),
  },
  {
    path: 'team',
    title: 'My team — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./team/employee-team.component').then(
        (m) => m.EmployeeTeamComponent,
      ),
  },
];
