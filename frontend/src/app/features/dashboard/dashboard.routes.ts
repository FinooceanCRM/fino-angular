import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    title: 'Dashboard — FINOOCEAN',
    loadComponent: () =>
      import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
