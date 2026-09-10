export const environment = {
  production: true,
  // Native Capacitor build. The bundled web assets are served from inside
  // the app (capacitor://localhost / https://localhost), so the API must
  // be reached at an ABSOLUTE, publicly resolvable URL — a relative
  // '/api/v1' would resolve against the WebView origin and 404.
  mobile: true,
  appName: 'FINOOCEAN',
  // LOCAL TESTING: this Mac's LAN IP, so a phone on the same Wi-Fi can
  // reach `php artisan serve --host 0.0.0.0` running on the dev machine.
  // Replace with the real production host before building a store binary.
  apiBaseUrl: 'http://192.168.0.102:8000/api/v1',
  withCredentials: false,
  // TODO: replace with the real hCaptcha site key before going live.
  hcaptchaSiteKey: '10000000-ffff-ffff-ffff-000000000001',
};
