<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as bot-protection providers. This file provides a sane default
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'captcha' => [
        'secret' => env('CAPTCHA_SECRET_KEY'),
    ],

    // Firebase Cloud Messaging (native-app push). Leave unset to disable
    // push entirely — PushService no-ops and in-app notifications are
    // unaffected. `credentials` is an absolute path to the service-account
    // JSON key downloaded from the Firebase console.
    'fcm' => [
        'project_id' => env('FCM_PROJECT_ID'),
        'credentials' => env('FCM_CREDENTIALS'),
    ],

];
