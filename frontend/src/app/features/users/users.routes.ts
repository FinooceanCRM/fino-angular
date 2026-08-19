import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { permissionGuard } from '@core/guards/permission.guard';

/** User management workspace. Every action is gated by its own permission. */
export const usersRoutes: Routes = [
  {
    path: '',
    title: 'Users — FINOOCEAN',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.view'] },
    loadComponent: () => import('./list/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'create',
    title: 'Create user — FINOOCEAN',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.create'] },
    loadComponent: () => import('./form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit user — FINOOCEAN',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.update'] },
    loadComponent: () => import('./form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: ':id',
    title: 'User details — FINOOCEAN',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.view'] },
    loadComponent: () =>
      import('./detail/user-detail.component').then((m) => m.UserDetailComponent),
  },
];
