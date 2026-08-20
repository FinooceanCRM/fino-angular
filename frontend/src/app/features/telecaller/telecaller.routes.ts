import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Telecaller workspace. Reachable only by the `telecaller` role. */
export const telecallerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Telecaller dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./dashboard/telecaller-dashboard.component').then(
        (m) => m.TelecallerDashboardComponent,
      ),
  },
  {
    path: 'leads',
    title: 'My submitted leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/my-leads/telecaller-my-leads.component').then(
        (m) => m.TelecallerMyLeadsComponent,
      ),
  },
  {
    path: 'leads/new',
    title: 'New leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/new/telecaller-new-leads.component').then(
        (m) => m.TelecallerNewLeadsComponent,
      ),
  },
  {
    path: 'leads/in-progress',
    title: 'In progress leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/in-progress/telecaller-in-progress-leads.component').then(
        (m) => m.TelecallerInProgressLeadsComponent,
      ),
  },
  {
    path: 'leads/documents-pending',
    title: 'Documents pending — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/documents-pending/telecaller-documents-pending-leads.component').then(
        (m) => m.TelecallerDocumentsPendingLeadsComponent,
      ),
  },
  {
    path: 'leads/under-review',
    title: 'Under review — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/under-review/telecaller-under-review-leads.component').then(
        (m) => m.TelecallerUnderReviewLeadsComponent,
      ),
  },
  {
    path: 'leads/approved',
    title: 'Approved leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/approved/telecaller-approved-leads.component').then(
        (m) => m.TelecallerApprovedLeadsComponent,
      ),
  },
  {
    path: 'leads/rejected',
    title: 'Rejected leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/rejected/telecaller-rejected-leads.component').then(
        (m) => m.TelecallerRejectedLeadsComponent,
      ),
  },
  {
    path: 'leads/disbursed',
    title: 'Disbursed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/disbursed/telecaller-disbursed-leads.component').then(
        (m) => m.TelecallerDisbursedLeadsComponent,
      ),
  },
  {
    path: 'leads/closed',
    title: 'Closed leads — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/closed/telecaller-closed-leads.component').then(
        (m) => m.TelecallerClosedLeadsComponent,
      ),
  },
  {
    path: 'leads/pd-queue',
    title: 'PD queue — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/pd-queue/telecaller-pd-queue-leads.component').then(
        (m) => m.TelecallerPdQueueLeadsComponent,
      ),
  },
  {
    path: 'leads/:id/timeline',
    title: 'Lead timeline — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/lead-timeline/telecaller-lead-timeline.component').then(
        (m) => m.TelecallerLeadTimelineComponent,
      ),
  },
  {
    // Must stay after the specific 'leads/...' paths above so it never shadows them.
    path: 'leads/:id',
    title: 'Lead details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./leads/lead-detail/telecaller-lead-detail.component').then(
        (m) => m.TelecallerLeadDetailComponent,
      ),
  },
  {
    path: 'follow-ups',
    title: 'Follow-ups — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./follow-ups/telecaller-follow-ups-list.component').then(
        (m) => m.TelecallerFollowUpsListComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Telecaller profile — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller'] },
    loadComponent: () =>
      import('./profile/telecaller-profile.component').then(
        (m) => m.TelecallerProfileComponent,
      ),
  },
];
