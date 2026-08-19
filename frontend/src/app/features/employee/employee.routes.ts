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
    path: 'leads',
    title: 'My Leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/my-leads/employee-my-leads.component').then(
        (m) => m.EmployeeMyLeadsComponent,
      ),
  },
  {
    path: 'leads/new',
    title: 'New leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/new/employee-new-leads.component').then(
        (m) => m.EmployeeNewLeadsComponent,
      ),
  },
  {
    path: 'leads/assigned',
    title: 'Assigned leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/assigned/employee-assigned-leads.component').then(
        (m) => m.EmployeeAssignedLeadsComponent,
      ),
  },
  {
    path: 'leads/in-progress',
    title: 'In progress leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/in-progress/employee-in-progress-leads.component').then(
        (m) => m.EmployeeInProgressLeadsComponent,
      ),
  },
  {
    path: 'leads/documents-pending',
    title: 'Documents pending — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/documents-pending/employee-documents-pending-leads.component').then(
        (m) => m.EmployeeDocumentsPendingLeadsComponent,
      ),
  },
  {
    path: 'leads/under-review',
    title: 'Under review — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/under-review/employee-under-review-leads.component').then(
        (m) => m.EmployeeUnderReviewLeadsComponent,
      ),
  },
  {
    path: 'leads/approved',
    title: 'Approved leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/approved/employee-approved-leads.component').then(
        (m) => m.EmployeeApprovedLeadsComponent,
      ),
  },
  {
    path: 'leads/rejected',
    title: 'Rejected leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/rejected/employee-rejected-leads.component').then(
        (m) => m.EmployeeRejectedLeadsComponent,
      ),
  },
  {
    path: 'leads/disbursed',
    title: 'Disbursed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/disbursed/employee-disbursed-leads.component').then(
        (m) => m.EmployeeDisbursedLeadsComponent,
      ),
  },
  {
    path: 'leads/closed',
    title: 'Closed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/closed/employee-closed-leads.component').then(
        (m) => m.EmployeeClosedLeadsComponent,
      ),
  },
  {
    path: 'leads/:id/timeline',
    title: 'Lead timeline — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/lead-timeline/employee-lead-timeline.component').then(
        (m) => m.EmployeeLeadTimelineComponent,
      ),
  },
  {
    // Must stay after the specific 'leads/...' paths above so it never shadows them.
    path: 'leads/:id',
    title: 'Lead details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['employee'] },
    loadComponent: () =>
      import('./leads/lead-detail/employee-lead-detail.component').then(
        (m) => m.EmployeeLeadDetailComponent,
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
