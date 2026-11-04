import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { SessionService } from '@core/services/session.service';

/**
 * Attaches the Sanctum bearer token and clears the session on a 401.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = session.token;

  const authed = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authed).pipe(
    catchError((error: unknown) => {
      const status = (error as { status?: number })?.status;

      // Customer-portal calls must never bounce a visitor into the staff
      // login or the CRM "unauthorized" page.
      const inPortal = router.url.startsWith('/account');

      if (status === 401) {
        auth.clear();
        void router.navigate([inPortal ? '/login' : '/auth/login']);
      }

      // 403 on a login attempt just means "wrong door"; the form shows the message.
      const isLoginCall = request.url.includes('/auth/login') || request.url.includes('/auth/register');
      if (status === 403 && !isLoginCall && !inPortal) {
        void router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    }),
  );
};
