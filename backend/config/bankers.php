<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Signup OTP
    |--------------------------------------------------------------------------
    |
    | A banker who self-registers through the public "Join as Banker" page
    | stays inactive until they confirm a 6-digit numeric OTP sent to the
    | phone number they signed up with. Same convention as
    | config/vendors.php and config/connectors.php. See
    | App\Services\BankerRegistrationService.
    |
    */
    'otp_expiry_minutes' => (int) env('BANKER_OTP_EXPIRY_MINUTES', 10),

    /*
    |--------------------------------------------------------------------------
    | Loan products
    |--------------------------------------------------------------------------
    |
    | The multi-select list shown on the "Join as Banker" form. The signup
    | request validates submitted products against these values, and the
    | banker profile stores the chosen subset as a JSON array.
    |
    */
    'products' => [
        'personal_loan' => 'Personal Loan',
        'business_loan' => 'Business Loan',
        'home_loan' => 'Home Loan',
        'car_loan' => 'Car Loan',
        'mortgage_loan' => 'Mortgage Loan',
    ],

];
