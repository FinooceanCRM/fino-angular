<?php

return [
    /*
     * Token-based (personal access token) authentication only.
     * No stateful SPA domains, no CSRF cookie, no session auth.
     */
    'stateful' => [],

    'guard' => [],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [],
];
