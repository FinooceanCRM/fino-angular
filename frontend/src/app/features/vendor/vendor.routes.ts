import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/**
 * Vendor workspace. Reachable only by the independent `vendor` role — same
 * `authGuard + roleGuard` pattern every standalone-role module uses (see
 * connector.routes.ts).
 *
 * Phase 3 adds the real Vendor Certification wizard + certificate screens.
 * Phase 4 points `loan-request` at the EXISTING Fino lead-creation form
 * (`@features/leads/form/LeadFormComponent`) — same UI, same validation,
 * same `POST /leads` API and the same post-submit workflow; the backend
 * stamps `vendor_id` from the authenticated user. Nothing loan-specific is
 * rebuilt here.
 */
const vendorData = { roles: ['vendor'] as const };

export const vendorRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Vendor dashboard — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: vendorData,
    loadComponent: () =>
      import('./dashboard/vendor-dashboard.component').then((m) => m.VendorDashboardComponent),
  },
  {
    path: 'certification',
    title: 'Vendor Certification — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: vendorData,
    loadComponent: () =>
      import('./survey/vendor-certification.component').then((m) => m.VendorCertificationComponent),
  },
  {
    path: 'certification/success/:id',
    title: 'Certification submitted — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: vendorData,
    loadComponent: () =>
      import('./survey/vendor-certification-success.component').then(
        (m) => m.VendorCertificationSuccessComponent,
      ),
  },
  {
    path: 'certificate/:id',
    title: 'Vendor Certificate — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: vendorData,
    loadComponent: () =>
      import('./survey/vendor-certificate.component').then((m) => m.VendorCertificateComponent),
  },
  {
    // The existing Fino loan-request form, mounted at a vendor-gated URL.
    // On submit it follows Fino's normal flow (navigates to the lead
    // detail page); the API scopes what the vendor can see there to their
    // own request.
    path: 'loan-request',
    title: 'Request a Loan — FINOOCEAN',
    canActivate: [authGuard, roleGuard],
    data: vendorData,
    loadComponent: () =>
      import('@features/leads/form/lead-form.component').then((m) => m.LeadFormComponent),
  },
];
