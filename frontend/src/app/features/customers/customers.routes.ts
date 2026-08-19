import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

/** Customer management, shared by every authenticated role — mock data, no HTTP. */
export const customersRoutes: Routes = [
  {
    path: '',
    title: 'Customer Management — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () => import('./customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: ':id',
    title: 'Customer profile — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customer-profile/customer-profile.component').then((m) => m.CustomerProfileComponent),
  },
];
