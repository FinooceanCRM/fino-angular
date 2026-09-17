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

    // Signup OTP delivery (Vendor/Banker/Connector). `otp_template_id` is
    // the DLT-approved MSG91 template used to send it. Leave either unset
    // to disable delivery — Msg91OtpService then just logs a warning and
    // the OTP flow continues to work the same as before (code still
    // generated/stored/verified, just not actually texted).
    'msg91' => [
        'auth_key' => env('MSG91_AUTH_KEY'),
        'otp_template_id' => env('MSG91_OTP_TEMPLATE_ID'),
    ],

];
