import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SessionService } from '@core/services/session.service';

/**
 * Attaches the Sanctum bearer token and clears the session on a 401.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.token;

  const authed = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authed).pipe(
    catchError((error: unknown) => {
      const status = (error as { status?: number })?.status;

      if (status === 401) {
        session.clear();
        void router.navigate(['/auth/login']);
      }

      if (status === 403) {
        void router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    }),
  );
};
