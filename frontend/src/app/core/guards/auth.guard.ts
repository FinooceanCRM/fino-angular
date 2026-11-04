import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';

import { AuthService } from '@core/services/auth.service';

/**
 * Blocks access unless a valid session exists. When a persisted token is
 * present but the user is not hydrated yet, it validates against /auth/me.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const redirect = () =>
    router.createUrlTree(['/auth/login'], {
      queryParams: { redirectTo: state.url },
    });

  // A customer holds a valid token but has no business in the CRM shell:
  // send them to their own portal instead of letting the staff routes load.
  const forRole = () =>
    auth.hasRole('customer') ? router.createUrlTree(['/account']) : true;

  if (auth.isAuthenticated()) {
    return forRole();
  }

  if (!auth.token) {
    return redirect();
  }

  return auth.loadCurrentUser().pipe(map((user) => (user ? forRole() : redirect())));
};

/**
 * Customer-portal guard: signed in AND a `customer`. Everyone else is sent to
 * the customer login (staff are never shown the portal).
 */
export const customerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const toLogin = () => router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
  const check = () => (auth.hasRole('customer') ? true : toLogin());

  if (auth.isAuthenticated()) {
    return check();
  }

  if (!auth.token) {
    return toLogin();
  }

  return auth.loadCurrentUser().pipe(map((user) => (user ? check() : toLogin())));
};

/**
 * Public home: a signed-in staff user lands on their workspace, a signed-in
 * customer on their portal, everyone else sees the website.
 */
export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([auth.hasRole('customer') ? '/account' : '/dashboard']);
};

/** Keeps signed-in users away from the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return of(true);
  }

  return of(router.createUrlTree([auth.hasRole('customer') ? '/account' : '/dashboard']));
};

/** Customer login/register pages: skip them when already signed in. */
export const customerGuestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([auth.hasRole('customer') ? '/account' : '/dashboard']);
};
