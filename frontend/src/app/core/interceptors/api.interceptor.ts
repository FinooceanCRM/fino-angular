import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '@env/environment';

/**
 * Adds JSON headers and credential support to every outgoing API request.
 */
export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const apiRequest = request.clone({
    withCredentials: environment.withCredentials,
    setHeaders: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // Keep the Angular service worker out of API calls: on any network
      // failure it fabricates a "504 Gateway Timeout", hiding the real error.
      'ngsw-bypass': 'true',
    },
  });

  return next(apiRequest);
};
