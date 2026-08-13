import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

export const reportsRoutes: Routes = [
  {
    path: '',
    title: 'Reports — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./reports.component').then((m) => m.ReportsComponent),
  },
];
