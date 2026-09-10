<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:4200'),
        // Origins used by the Capacitor native app's WebView (Android with
        // server.androidScheme: 'https' → 'https://localhost'; iOS →
        // 'capacitor://localhost'). Harmless to allow — bearer-token auth,
        // no cookies.
        'https://localhost',
        'http://localhost',
        'capacitor://localhost',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    // Token-based auth only: no cookies are exchanged.
    'supports_credentials' => false,
];
