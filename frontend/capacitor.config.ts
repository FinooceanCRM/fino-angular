import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the existing Angular build as native iOS/Android apps.
 * `webDir` is the Angular production output; run `npm run build` (or the
 * `mobile` configuration) before `npx cap sync`.
 *
 * The API host is NOT configured here — it comes from
 * `src/environments/environment.mobile.ts` so it can differ per build
 * without touching native project files.
 */
const config: CapacitorConfig = {
  appId: 'com.finoocean.app',
  appName: 'FINOOCEAN',
  webDir: 'dist/finoocean/browser',
  server: {
    // LOCAL TESTING: serve the app from http://localhost so plain-HTTP calls
    // to a `php artisan serve` backend on the LAN are same-scheme (no mixed
    // content). `http://localhost` is still a secure context on Android, so
    // camera / geolocation keep working. Flip back to 'https' (and drop
    // `cleartext`) for a store build that talks to an https API.
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0a2a43',
      showSpinner: false,
    },
  },
};

export default config;
