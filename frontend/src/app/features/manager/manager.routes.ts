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
    path: 'leads',
    title: 'Leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/all/manager-all-leads.component').then(
        (m) => m.ManagerAllLeadsComponent,
      ),
  },
  {
    path: 'leads/new',
    title: 'New leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/new/manager-new-leads.component').then(
        (m) => m.ManagerNewLeadsComponent,
      ),
  },
  {
    path: 'leads/assigned',
    title: 'Assigned leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/assigned/manager-assigned-leads.component').then(
        (m) => m.ManagerAssignedLeadsComponent,
      ),
  },
  {
    path: 'leads/processing',
    title: 'Processing leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/processing/manager-processing-leads.component').then(
        (m) => m.ManagerProcessingLeadsComponent,
      ),
  },
  {
    path: 'leads/approved',
    title: 'Approved leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/approved/manager-approved-leads.component').then(
        (m) => m.ManagerApprovedLeadsComponent,
      ),
  },
  {
    path: 'leads/disbursed',
    title: 'Disbursed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/disbursed/manager-disbursed-leads.component').then(
        (m) => m.ManagerDisbursedLeadsComponent,
      ),
  },
  {
    path: 'leads/rejected',
    title: 'Rejected leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/rejected/manager-rejected-leads.component').then(
        (m) => m.ManagerRejectedLeadsComponent,
      ),
  },
  {
    path: 'leads/:id/timeline',
    title: 'Lead timeline — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/lead-timeline/manager-lead-timeline.component').then(
        (m) => m.ManagerLeadTimelineComponent,
      ),
  },
  {
    path: 'leads/:id/assign',
    title: 'Lead assignment — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/lead-assignment/manager-lead-assignment.component').then(
        (m) => m.ManagerLeadAssignmentComponent,
      ),
  },
  {
    // Must stay after the specific `leads/...` paths above so it never shadows them.
    path: 'leads/:id',
    title: 'Lead details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./leads/lead-detail/manager-lead-detail.component').then(
        (m) => m.ManagerLeadDetailComponent,
      ),
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
  {
    path: 'employees/:id',
    title: 'Employee details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./employees/detail/manager-employee-detail.component').then(
        (m) => m.ManagerEmployeeDetailComponent,
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
    path: 'relationship-managers/:id',
    title: 'Relationship Manager details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import(
        './relationship-managers/detail/manager-relationship-manager-detail.component'
      ).then((m) => m.ManagerRelationshipManagerDetailComponent),
  },
  {
    path: 'bankers',
    title: 'Bankers — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./bankers/list/manager-banker-list.component').then(
        (m) => m.ManagerBankerListComponent,
      ),
  },
  {
    path: 'bankers/criteria',
    title: 'Banker criteria — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./bankers/criteria/manager-banker-criteria.component').then(
        (m) => m.ManagerBankerCriteriaComponent,
      ),
  },
  {
    path: 'bankers/access-requests',
    title: 'Access requests — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./bankers/access-requests/manager-access-requests.component').then(
        (m) => m.ManagerAccessRequestsComponent,
      ),
  },
  {
    path: 'bankers/lead-requests',
    title: 'Lead requests — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./bankers/lead-requests/manager-lead-requests.component').then(
        (m) => m.ManagerLeadRequestsComponent,
      ),
  },
  {
    path: 'bankers/assigned',
    title: 'Assigned bankers — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./bankers/assigned/manager-assigned-bankers.component').then(
        (m) => m.ManagerAssignedBankersComponent,
      ),
  },
  {
    path: 'bankers/performance',
    title: 'Banker performance — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./bankers/performance/manager-banker-performance.component').then(
        (m) => m.ManagerBankerPerformanceComponent,
      ),
  },
  {
    path: 'approvals',
    title: 'Approval Center — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./approvals/manager-approvals.component').then(
        (m) => m.ManagerApprovalsComponent,
      ),
  },
  {
    path: 'reports',
    title: 'Reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./reports/manager-reports.component').then(
        (m) => m.ManagerReportsComponent,
      ),
  },
  {
    path: 'reports/leads',
    title: 'Lead reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./reports/leads/manager-lead-reports.component').then(
        (m) => m.ManagerLeadReportsComponent,
      ),
  },
  {
    path: 'reports/employees',
    title: 'Employee reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./reports/employees/manager-employee-reports.component').then(
        (m) => m.ManagerEmployeeReportsComponent,
      ),
  },
  {
    path: 'reports/relationship-managers',
    title: 'RM reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./reports/relationship-managers/manager-rm-reports.component').then(
        (m) => m.ManagerRmReportsComponent,
      ),
  },
  {
    path: 'reports/bankers',
    title: 'Banker reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./reports/bankers/manager-banker-reports.component').then(
        (m) => m.ManagerBankerReportsComponent,
      ),
  },
  {
    path: 'reports/performance',
    title: 'Performance reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./reports/performance/manager-performance-reports.component').then(
        (m) => m.ManagerPerformanceReportsComponent,
      ),
  },
  {
    path: 'notifications',
    title: 'Notifications — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['manager'] },
    loadComponent: () =>
      import('./notifications/manager-notifications.component').then(
        (m) => m.ManagerNotificationsComponent,
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
];
