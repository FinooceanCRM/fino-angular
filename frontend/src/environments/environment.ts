export const environment = {
  production: false,
  // True only in native (Capacitor) builds — see environment.mobile.ts.
  // Guards behavior that must not run in a browser tab (native status bar,
  // splash screen, hardware back button, secure token storage).
  mobile: false,
  appName: 'FINOOCEAN',
  apiBaseUrl: '/api/v1',
  // Token-based auth only — no cookies are sent.
  withCredentials: false,
  // hCaptcha's official "always passes" sandbox key (see
  // https://docs.hcaptcha.com/#integration-testing-test-keys) — matches
  // CaptchaVerificationService's provider on the backend. Replace with a
  // real site key before going live.
  hcaptchaSiteKey: '10000000-ffff-ffff-ffff-000000000001',
};
