import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    // One sign-in page for staff and customers lives at /login (website).
    // Kept as a redirect so existing links, bookmarks and the auth guard's
    // "/auth/login?redirectTo=..." keep working; query params are preserved.
    path: 'login',
    redirectTo: '/login',
  },
];
