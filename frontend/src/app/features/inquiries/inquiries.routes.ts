import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/**
 * Customer Inquiries queue. Telecaller + Super Admin only. This is a UX gate;
 * the API (`role:telecaller,super_admin` + InquiryQueueService) is the real one.
 */
export const inquiriesRoutes: Routes = [
  {
    path: '',
    title: 'Customer inquiries — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller', 'super_admin'] },
    loadComponent: () => import('./inquiry-list.component').then((m) => m.InquiryListComponent),
  },
  {
    // Declared before ':id' so "routing" is never read as an inquiry id.
    path: 'routing',
    title: 'Inquiry routing — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () => import('./inquiry-routing.component').then((m) => m.InquiryRoutingComponent),
  },
  {
    path: ':id',
    title: 'Inquiry details — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['telecaller', 'super_admin'] },
    loadComponent: () => import('./inquiry-detail.component').then((m) => m.InquiryDetailComponent),
  },
];
