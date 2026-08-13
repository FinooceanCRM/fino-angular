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

  if (auth.isAuthenticated()) {
    return true;
  }

  if (!auth.token) {
    return redirect();
  }

  return auth.loadCurrentUser().pipe(map((user) => (user ? true : redirect())));
};

/** Keeps signed-in users away from the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return of(true);
  }

  return of(router.createUrlTree(['/dashboard']));
};
