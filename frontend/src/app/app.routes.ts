import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { AppShellComponent } from '@shared/layout/app-shell.component';

export const routes: Routes = [
  {
    // Public referral landing (Phase 8) — a marketing surface, not part of
    // the authenticated SPA. Declared before the shell-wrapped route below
    // so it's matched first and never falls through to the shell's own
    // wildcard/not-found route; no AppShellComponent, no authGuard.
    path: 'refer/:code',
    title: 'Refer a client — FINOOCEAN',
    loadComponent: () =>
      import('@features/public/refer/public-refer.component').then(
        (m) => m.PublicReferComponent,
      ),
  },
  {
    // Public connector invite/signup — recruiting-only, separate from the
    // customer lead-capture page above. Same shell-bypass reasoning.
    path: 'join-connector',
    title: 'Become a connector — FINOOCEAN',
    loadComponent: () =>
      import('@features/public/join-connector/public-join-connector.component').then(
        (m) => m.PublicJoinConnectorComponent,
      ),
  },
  {
    path: 'join-connector/:code',
    title: 'Become a connector — FINOOCEAN',
    loadComponent: () =>
      import('@features/public/join-connector/public-join-connector.component').then(
        (m) => m.PublicJoinConnectorComponent,
      ),
  },
  {
    // Everything else renders inside the authenticated app shell
    // (topbar/sidebar/breadcrumb) — see AppShellComponent.
    path: '',
    component: AppShellComponent,
    children: [
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
        // Affiliate module. Independent of the reporting hierarchy, like Connector.
        path: 'affiliate',
        loadChildren: () =>
          import('@features/affiliate/affiliate.routes').then(
            (m) => m.affiliateRoutes,
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
        // Accounts module. Finance/reconciliation staff — disbursements,
        // commissions, payouts and the accounting ledger across every payee.
        path: 'accounts',
        loadChildren: () =>
          import('@features/accounts/accounts.routes').then((m) => m.accountsRoutes),
      },
      {
        // Banker module. Matched-leads dashboard.
        path: 'banker',
        loadChildren: () =>
          import('@features/banker/banker.routes').then((m) => m.bankerRoutes),
      },
      {
        // Telecaller module. Independent of the reporting hierarchy, like Connector and Banker.
        path: 'telecaller',
        loadChildren: () =>
          import('@features/telecaller/telecaller.routes').then(
            (m) => m.telecallerRoutes,
          ),
      },
      {
        // Loan management workflow (Phase 9).
        path: 'leads',
        loadChildren: () =>
          import('@features/leads/leads.routes').then((m) => m.leadsRoutes),
      },
      {
        // Customer Management (Phase 3). Shared by every authenticated
        // role, row-scoped by the API (own + linked-via-visible-lead).
        path: 'customers',
        loadChildren: () =>
          import('@features/customers/customers.routes').then(
            (m) => m.customersRoutes,
          ),
      },
      {
        // Tasks (Phase 4). Shared by every authenticated role, row-scoped
        // by the API (own + team). Also backs the Relationship Manager
        // module's Activities tabs via the `assigned_to=team` filter.
        path: 'tasks',
        loadChildren: () =>
          import('@features/tasks/tasks.routes').then((m) => m.tasksRoutes),
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
        // User management (list/create/edit/detail). Each sub-route carries its
        // own permission requirement.
        path: 'users',
        loadChildren: () =>
          import('@features/users/users.routes').then((m) => m.usersRoutes),
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
    ],
  },
];
