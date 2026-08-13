import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    title: 'Sign in — FINOOCEAN',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
];
