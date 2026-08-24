import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/** Lead management workspace (Phase 9). Open to every authenticated role; */
/** the API scopes what each of them can see and do. */
export const leadsRoutes: Routes = [
  {
    path: '',
    title: 'Leads — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./list/lead-list.component').then((m) => m.LeadListComponent),
  },
  {
    path: 'create',
    title: 'Create lead — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./form/lead-form.component').then((m) => m.LeadFormComponent),
  },
  {
    path: ':id',
    title: 'Lead details — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./detail/lead-detail.component').then(
        (m) => m.LeadDetailComponent,
      ),
  },
  {
    path: ':id/edit',
    title: 'Edit lead — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./form/lead-form.component').then((m) => m.LeadFormComponent),
  },
  {
    path: ':id/pd',
    title: 'Full PD — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin', 'manager', 'telecaller'] },
    loadComponent: () =>
      import('./pd/pd-form.component').then((m) => m.PdFormComponent),
  },
];
