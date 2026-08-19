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
  {
    // Tabs the existing `employees` and `connectors` pages together. Those
    // two routes are left in place (unlinked from navigation) rather than
    // removed, so nothing that already points at them breaks.
    path: 'team',
    title: 'Team management — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./team/relationship-manager-team.component').then(
        (m) => m.RelationshipManagerTeamComponent,
      ),
  },
  {
    path: 'leads',
    title: 'My leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/my/relationship-manager-my-leads.component').then(
        (m) => m.RelationshipManagerMyLeadsComponent,
      ),
  },
  {
    path: 'leads/assigned',
    title: 'Assigned leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/assigned/relationship-manager-assigned-leads.component').then(
        (m) => m.RelationshipManagerAssignedLeadsComponent,
      ),
  },
  {
    path: 'leads/processing',
    title: 'Processing leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/processing/relationship-manager-processing-leads.component').then(
        (m) => m.RelationshipManagerProcessingLeadsComponent,
      ),
  },
  {
    path: 'leads/approved',
    title: 'Approved leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/approved/relationship-manager-approved-leads.component').then(
        (m) => m.RelationshipManagerApprovedLeadsComponent,
      ),
  },
  {
    path: 'leads/disbursed',
    title: 'Disbursed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/disbursed/relationship-manager-disbursed-leads.component').then(
        (m) => m.RelationshipManagerDisbursedLeadsComponent,
      ),
  },
  {
    path: 'leads/:id/timeline',
    title: 'Lead timeline — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/lead-timeline/relationship-manager-lead-timeline.component').then(
        (m) => m.RelationshipManagerLeadTimelineComponent,
      ),
  },
  {
    // Must stay after the specific `leads/...` paths above so it never shadows them.
    path: 'leads/:id',
    title: 'Lead details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./leads/lead-detail/relationship-manager-lead-detail.component').then(
        (m) => m.RelationshipManagerLeadDetailComponent,
      ),
  },
  {
    path: 'reports',
    title: 'Reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./reports/relationship-manager-reports.component').then(
        (m) => m.RelationshipManagerReportsComponent,
      ),
  },
  {
    path: 'notifications',
    title: 'Notifications — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['relationship_manager'] },
    loadComponent: () =>
      import('./notifications/relationship-manager-notifications.component').then(
        (m) => m.RelationshipManagerNotificationsComponent,
      ),
  },
];
