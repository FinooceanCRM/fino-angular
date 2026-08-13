import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface NormalizedApiError {
  status: number;
  message: string;
  errors: Record<string, string[]>;
}

/**
 * Normalises backend error envelopes into a predictable shape.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const normalized: NormalizedApiError = {
        status: error.status,
        message:
          error.error?.message ?? error.message ?? 'Unexpected server error.',
        errors: error.error?.errors ?? {},
      };

      return throwError(() => normalized);
    }),
  );
