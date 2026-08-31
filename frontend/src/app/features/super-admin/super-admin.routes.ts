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
    // Affiliate Management (Phase 8) — view/suspend affiliates and set a
    // per-affiliate commission_rate override. Not a generic UserRoleTableComponent
    // instance like the roles above: affiliates need the Phase 6
    // super-admin/affiliates endpoints, not the generic /users CRUD.
    path: 'users/affiliates',
    title: 'Affiliates — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/affiliates/super-admin-affiliates.component').then(
        (m) => m.SuperAdminAffiliatesComponent,
      ),
  },
  {
    // Not previously routed (dead code, unreachable) — wired up alongside
    // the Phase 0 permissions matrix so the rewired component is actually
    // reachable. Linked from the Roles page's "Manage permissions" action.
    path: 'users/permissions',
    title: 'Permission Assignment — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/permissions/super-admin-permissions.component').then(
        (m) => m.SuperAdminPermissionsComponent,
      ),
  },
  {
    // Same as `users/permissions` above — previously unreachable.
    path: 'users/roles',
    title: 'Roles — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./users/roles/super-admin-roles.component').then((m) => m.SuperAdminRolesComponent),
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
    // Bankers' "Request Full Details" access requests land here for
    // approval — same LeadAccessRequestController workflow as the
    // Manager's "Access approvals" tab (see manager.routes.ts `approvals`).
    path: 'approvals',
    title: 'Approvals — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./approvals/super-admin-approvals.component').then(
        (m) => m.SuperAdminApprovalsComponent,
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
    // The old card-grid landing page (super-admin-reports.component.ts) is
    // superseded by the tabbed Lead Reports page below, which now carries
    // the shared "Reports" header + tab strip (see
    // reports-tabs/super-admin-reports-tabs.component.ts) — matches the
    // approved Reports overview mockup. The landing component's file is
    // left in place, just no longer routed to.
    path: 'reports',
    pathMatch: 'full',
    redirectTo: 'reports/lead-reports',
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
    // Was built but never wired into a route or the reports landing page —
    // it's real, complete code (own doc-comment, own computed signals),
    // just unreachable until now.
    path: 'reports/commission-reports',
    title: 'Commission reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./reports/commission-reports/super-admin-commission-reports.component').then(
        (m) => m.SuperAdminCommissionReportsComponent,
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
  {
    // Commissions module (connector/affiliate commission, payouts,
    // accounting) — pre-existing components with no route registration at
    // all before Phase 8; wired up here so they're actually reachable.
    path: 'commissions',
    title: 'Commissions — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./commissions/super-admin-commissions.component').then(
        (m) => m.SuperAdminCommissionsComponent,
      ),
  },
  {
    path: 'commissions/connector-commission',
    title: 'Connector Commission — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./commissions/connector-commission/super-admin-connector-commission.component').then(
        (m) => m.SuperAdminConnectorCommissionComponent,
      ),
  },
  {
    path: 'commissions/affiliate-commission',
    title: 'Affiliate Commission — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./commissions/affiliate-commission/super-admin-affiliate-commission.component').then(
        (m) => m.SuperAdminAffiliateCommissionComponent,
      ),
  },
  {
    path: 'commissions/payouts',
    title: 'Payouts — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./commissions/payouts/super-admin-payouts.component').then(
        (m) => m.SuperAdminPayoutsComponent,
      ),
  },
  {
    path: 'commissions/accounting',
    title: 'Accounting — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./commissions/accounting/super-admin-accounting.component').then(
        (m) => m.SuperAdminAccountingComponent,
      ),
  },
  {
    path: 'audit-logs',
    title: 'Audit Logs — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./audit-logs/super-admin-audit-logs.component').then(
        (m) => m.SuperAdminAuditLogsComponent,
      ),
  },
  {
    // Must stay after 'audit-logs' so it never shadows it.
    path: 'audit-logs/:id',
    title: 'Audit log details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./audit-logs/audit-log-detail/super-admin-audit-log-detail.component').then(
        (m) => m.SuperAdminAuditLogDetailComponent,
      ),
  },
  {
    // Platform configuration (Phase 1) — General, Matching Engine,
    // Notifications, Security. A single tab-switcher page (MatTabGroup, no
    // child router-outlet), so only one route is needed for all 4 sections.
    path: 'settings',
    title: 'Settings — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./settings/super-admin-settings.component').then((m) => m.SuperAdminSettingsComponent),
  },
  {
    // Global search (Phase 1) — full-results view behind the search
    // overlay's "View all" and the overlay's own `viewAll()` navigation.
    // Previously not routed at all (dead code, unreachable).
    // Global search (SearchService) is scoped server-side to the caller's
    // own visibility, same as every other row-scoped endpoint in the app —
    // there's no real backend reason this results page (or its overlay,
    // opened from the topbar for every role) should be super-admin-only,
    // so only authGuard applies here. The route keeps its historical
    // super-admin/ URL prefix to avoid a wider file-move/import churn for
    // a phase scoped to visual changes.
    path: 'search',
    title: 'Search — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./search/search-results/super-admin-search-results.component').then(
        (m) => m.SuperAdminSearchResultsComponent,
      ),
  },
];
