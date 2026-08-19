import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/**
 * Banker workspace. The four lead buckets (Matched/Priority/Assigned/My
 * Submitted) replace the old "My Leads" workflow-stage buckets and the
 * separate "Lead Access Requests" section — that workflow (Send Request /
 * Request Full Details) is now an action inside these buckets instead
 * (see `banker-lead-view-dialog.component.ts`). "View" opens that dialog;
 * "Update" routes out to the shared, role-agnostic `/leads/:id` page, so
 * there's no banker-scoped lead-detail route here any more.
 */
export const bankerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Banker dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./dashboard/banker-dashboard.component').then((m) => m.BankerDashboardComponent),
  },
  {
    path: 'leads',
    title: 'Matched Leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./leads/matched/banker-matched-leads.component').then(
        (m) => m.BankerMatchedLeadsComponent,
      ),
  },
  {
    path: 'leads/priority',
    title: 'Priority Leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./leads/priority/banker-priority-leads.component').then(
        (m) => m.BankerPriorityLeadsComponent,
      ),
  },
  {
    path: 'leads/assigned',
    title: 'Assigned Leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./leads/assigned/banker-assigned-leads.component').then(
        (m) => m.BankerAssignedLeadsComponent,
      ),
  },
  {
    path: 'leads/submitted',
    title: 'My Submitted Leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./leads/submitted/banker-submitted-leads.component').then(
        (m) => m.BankerSubmittedLeadsComponent,
      ),
  },
  {
    path: 'criteria',
    title: 'Bank Criteria — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./criteria/banker-criteria.component').then((m) => m.BankerCriteriaComponent),
  },
  {
    path: 'documents',
    title: 'Documents — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./documents/banker-documents.component').then((m) => m.BankerDocumentsComponent),
  },
  {
    path: 'reports',
    title: 'Reports — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./reports/banker-reports.component').then((m) => m.BankerReportsComponent),
  },
  {
    path: 'notifications',
    title: 'Notifications — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./notifications/banker-notifications.component').then(
        (m) => m.BankerNotificationsComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Banker profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['banker'] },
    loadComponent: () =>
      import('./profile/banker-profile.component').then((m) => m.BankerProfileComponent),
  },
];
