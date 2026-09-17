<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Commission Rate
    |--------------------------------------------------------------------------
    |
    | Used when a connector has no commission_rate of their own set
    | (connectors.commission_rate is null — see App\Models\Connector).
    |
    | A PERCENTAGE, not a fraction (e.g. 1.00 means 1%) — same convention as
    | config/affiliates.php, matching the column's decimal(5,2) precision.
    |
    */
    'default_commission_rate' => (float) env('CONNECTOR_DEFAULT_COMMISSION_RATE', 20.00),

    /*
    |--------------------------------------------------------------------------
    | Referral Override Rate
    |--------------------------------------------------------------------------
    |
    | A single global percentage (not configurable per connector in v1).
    | When a connector earns a commission, their direct inviter earns this
    | percentage of it; that inviter's own inviter earns this percentage of
    | THAT override; and so on up the referral chain until a connector with
    | no inviter is reached. See App\Services\ConnectorCommissionService.
    |
    */
    'referral_override_rate' => (float) env('CONNECTOR_REFERRAL_OVERRIDE_RATE', 20.00),

    /*
    |--------------------------------------------------------------------------
    | Signup OTP
    |--------------------------------------------------------------------------
    |
    | A connector's account stays inactive until they confirm a 6-digit
    | numeric OTP sent to the phone number they signed up with. See
    | ConnectorRegistrationService.
    |
    */
    'otp_expiry_minutes' => (int) env('CONNECTOR_OTP_EXPIRY_MINUTES', 10),

    /*
    |--------------------------------------------------------------------------
    | Signup OTP kill switch
    |--------------------------------------------------------------------------
    |
    | TEMPORARY: see config/vendors.php for why this exists and how to
    | restore it. Same shared SIGNUP_OTP_REQUIRED env var.
    |
    */
    'otp_required' => (bool) env('SIGNUP_OTP_REQUIRED', true),

];
