import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** RM workspace. Reachable only by the `relationship_manager` role. */
export const relationshipManagerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'RM dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./dashboard/relationship-manager-dashboard.component').then(
        (m) => m.RelationshipManagerDashboardComponent,
      ),
  },
  {
    path: 'profile',
    title: 'RM profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./profile/relationship-manager-profile.component').then(
        (m) => m.RelationshipManagerProfileComponent,
      ),
  },
  {
    path: 'employees',
    title: 'My employees — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./employees/relationship-manager-employees.component').then(
        (m) => m.RelationshipManagerEmployeesComponent,
      ),
  },
  {
    path: 'connectors',
    title: 'My connectors — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./connectors/relationship-manager-connectors.component').then(
        (m) => m.RelationshipManagerConnectorsComponent,
      ),
  },
];
