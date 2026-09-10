import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { apiInterceptor } from '@core/interceptors/api.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { NativeShellService } from '@core/services/native-shell.service';
import { SessionService } from '@core/services/session.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([apiInterceptor, authInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    // Load the persisted session into SessionService's synchronous cache
    // before the first navigation, then wire native chrome. Runs on every
    // platform; native-only work is a no-op in the browser. All `inject()`
    // calls are resolved synchronously here — calling inject() after an
    // `await` would be outside the injection context.
    provideAppInitializer(() => {
      const session = inject(SessionService);
      const nativeShell = inject(NativeShellService);
      return (async () => {
        try {
          await session.hydrate();
          await nativeShell.init();
        } catch (error) {
          console.error('App initializer failed', error);
        }
      })();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
