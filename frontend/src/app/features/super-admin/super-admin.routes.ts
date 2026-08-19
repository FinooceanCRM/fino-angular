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
  {
    path: 'users',
    title: 'Super Admin users — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/super-admin-users.component').then((m) => m.SuperAdminUsersComponent),
  },
  {
    path: 'users/managers',
    title: 'Managers — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/managers/super-admin-managers.component').then((m) => m.SuperAdminManagersComponent),
  },
  {
    path: 'users/relationship-managers',
    title: 'Relationship Managers — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/relationship-managers/super-admin-relationship-managers.component').then(
        (m) => m.SuperAdminRelationshipManagersComponent,
      ),
  },
  {
    path: 'users/employees',
    title: 'Employees — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/employees/super-admin-employees.component').then((m) => m.SuperAdminEmployeesComponent),
  },
  {
    path: 'users/connectors',
    title: 'Connectors — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/connectors/super-admin-connectors.component').then((m) => m.SuperAdminConnectorsComponent),
  },
  {
    path: 'users/bankers',
    title: 'Bankers — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/bankers/super-admin-bankers.component').then((m) => m.SuperAdminBankersComponent),
  },
  {
    path: 'leads',
    title: 'Super Admin leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/super-admin-leads.component').then((m) => m.SuperAdminLeadsComponent),
  },
  {
    path: 'leads/new',
    title: 'New leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/new/super-admin-new-leads.component').then((m) => m.SuperAdminNewLeadsComponent),
  },
  {
    path: 'leads/assigned',
    title: 'Assigned leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/assigned/super-admin-assigned-leads.component').then(
        (m) => m.SuperAdminAssignedLeadsComponent,
      ),
  },
  {
    path: 'leads/processing',
    title: 'Processing leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/processing/super-admin-processing-leads.component').then(
        (m) => m.SuperAdminProcessingLeadsComponent,
      ),
  },
  {
    path: 'leads/approved',
    title: 'Approved leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/approved/super-admin-approved-leads.component').then(
        (m) => m.SuperAdminApprovedLeadsComponent,
      ),
  },
  {
    path: 'leads/disbursed',
    title: 'Disbursed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/disbursed/super-admin-disbursed-leads.component').then(
        (m) => m.SuperAdminDisbursedLeadsComponent,
      ),
  },
  {
    path: 'leads/rejected',
    title: 'Rejected leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/rejected/super-admin-rejected-leads.component').then(
        (m) => m.SuperAdminRejectedLeadsComponent,
      ),
  },
  {
    // Must stay after the specific `leads/...` paths above so it never shadows them.
    path: 'leads/:id',
    title: 'Lead details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./leads/lead-detail/super-admin-lead-detail.component').then(
        (m) => m.SuperAdminLeadDetailComponent,
      ),
  },
  {
    path: 'banking',
    title: 'Super Admin banking — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./banking/super-admin-banking.component').then((m) => m.SuperAdminBankingComponent),
  },
  {
    path: 'banking/bank-criteria',
    title: 'Bank criteria — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./banking/bank-criteria/super-admin-bank-criteria.component').then(
        (m) => m.SuperAdminBankCriteriaComponent,
      ),
  },
  {
    path: 'banking/matching-engine',
    title: 'Matching engine — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./banking/matching-engine/super-admin-matching-engine.component').then(
        (m) => m.SuperAdminMatchingEngineComponent,
      ),
  },
  {
    path: 'banking/assigned-leads',
    title: 'Assigned leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./banking/assigned-leads/super-admin-assigned-leads.component').then(
        (m) => m.SuperAdminAssignedLeadsComponent,
      ),
  },
  {
    path: 'reports',
    title: 'Super Admin reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./reports/super-admin-reports.component').then((m) => m.SuperAdminReportsComponent),
  },
  {
    path: 'reports/lead-reports',
    title: 'Lead reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./reports/lead-reports/super-admin-lead-reports.component').then(
        (m) => m.SuperAdminLeadReportsComponent,
      ),
  },
  {
    path: 'reports/user-reports',
    title: 'User reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./reports/user-reports/super-admin-user-reports.component').then(
        (m) => m.SuperAdminUserReportsComponent,
      ),
  },
  {
    path: 'reports/performance-reports',
    title: 'Performance reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./reports/performance-reports/super-admin-performance-reports.component').then(
        (m) => m.SuperAdminPerformanceReportsComponent,
      ),
  },
  {
    path: 'notifications',
    title: 'Super Admin notifications — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./notifications/super-admin-notifications.component').then(
        (m) => m.SuperAdminNotificationsComponent,
      ),
  },
];
