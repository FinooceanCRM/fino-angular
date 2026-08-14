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
    // Employee module (Phase 6). Leaf of the reporting hierarchy.
    path: 'employee',
    loadChildren: () =>
      import('@features/employee/employee.routes').then(
        (m) => m.employeeRoutes,
      ),
  },
  {
    // Relationship Manager module (Phase 7). Between Manager and Employee.
    path: 'relationship-manager',
    loadChildren: () =>
      import(
        '@features/relationship-manager/relationship-manager.routes'
      ).then((m) => m.relationshipManagerRoutes),
  },
  {
    // Manager module (Phase 8). Owns Relationship Managers and their teams.
    path: 'manager',
    loadChildren: () =>
      import('@features/manager/manager.routes').then((m) => m.managerRoutes),
  },
  {
    // Super Admin module. Platform-wide dashboard.
    path: 'super-admin',
    loadChildren: () =>
      import('@features/super-admin/super-admin.routes').then(
        (m) => m.superAdminRoutes,
      ),
  },
  {
    // Banker module. Matched-leads dashboard.
    path: 'banker',
    loadChildren: () =>
      import('@features/banker/banker.routes').then((m) => m.bankerRoutes),
  },
  {
    // Loan management workflow (Phase 9).
    path: 'leads',
    loadChildren: () =>
      import('@features/leads/leads.routes').then((m) => m.leadsRoutes),
  },
  {
    path: 'banks',
    loadChildren: () =>
      import('@features/banks/banks.routes').then((m) => m.banksRoutes),
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('@features/documents/documents.routes').then(
        (m) => m.documentsRoutes,
      ),
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('@features/notifications/notifications.routes').then(
        (m) => m.notificationsRoutes,
      ),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('@features/reports/reports.routes').then((m) => m.reportsRoutes),
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
