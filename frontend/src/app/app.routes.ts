import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { permissionGuard } from '@core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/dashboard/dashboard.routes').then(
        (m) => m.dashboardRoutes,
      ),
  },
  {
    // Connector module (Phase 5). Independent of the reporting hierarchy.
    path: 'connector',
    loadChildren: () =>
      import('@features/connector/connector.routes').then(
        (m) => m.connectorRoutes,
      ),
  },
  {
    // Permission-protected area. Screens land here in a later phase; the
    // access-control wiring is complete already.
    path: 'users',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.view'] },
    title: 'Users — FINOOCEAN',
    loadComponent: () =>
      import('@shared/components/placeholder.component').then(
        (m) => m.PlaceholderComponent,
      ),
  },
  {
    path: 'unauthorized',
    title: 'Not authorised — FINOOCEAN',
    loadComponent: () =>
      import('@shared/components/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
