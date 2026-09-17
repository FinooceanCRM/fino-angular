<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Signup OTP
    |--------------------------------------------------------------------------
    |
    | A vendor's account stays inactive until they confirm a 6-digit numeric
    | OTP sent to the phone number they signed up with. Same convention as
    | config/connectors.php. See App\Services\VendorRegistrationService.
    |
    */
    'otp_expiry_minutes' => (int) env('VENDOR_OTP_EXPIRY_MINUTES', 10),

    /*
    |--------------------------------------------------------------------------
    | Signup OTP kill switch
    |--------------------------------------------------------------------------
    |
    | TEMPORARY: false until DLT/MSG91 approval comes through (no SMS
    | gateway can deliver the OTP until then — see Msg91OtpService). While
    | false, VendorRegistrationService activates the account immediately on
    | signup instead of gating it behind a phone OTP. Flip
    | SIGNUP_OTP_REQUIRED back to true once approved; no code changes
    | needed. Shared by config/bankers.php and config/connectors.php.
    |
    */
    'otp_required' => (bool) env('SIGNUP_OTP_REQUIRED', true),

    /*
    |--------------------------------------------------------------------------
    | Vendor Certification
    |--------------------------------------------------------------------------
    |
    | Ported from the reference Customer Survey (config/config.php). `org` /
    | `department` / `officer` are printed on the certificate; `number_*`
    | drive the VC0000001-style certificate number; `duplicate_window_minutes`
    | is the soft same-mobile+same-shop guard from `pages/submit.php`.
    |
    */
    'certificate' => [
        'org' => env('VENDOR_CERT_ORG', 'FINOOCEAN Vendor Certification Cell'),
        'department' => env('VENDOR_CERT_DEPARTMENT', 'Department of Vendor Onboarding'),
        'officer' => env('VENDOR_CERT_OFFICER', 'Authorised Certification Officer'),
        'number_prefix' => 'VC',
        'number_pad' => 7,
    ],

    'duplicate_window_minutes' => 10,

    /*
    |--------------------------------------------------------------------------
    | Certification image rules
    |--------------------------------------------------------------------------
    |
    | One profile per slot, matching helpers/upload.php's `upload_profiles()`.
    | Served to the Angular upload component so client + server share one rule
    | set.
    |
    */
    'image_profiles' => [
        'vendor' => [
            'label' => 'Vendor passport photo',
            'folder' => 'vendor',
            'max_bytes' => 5 * 1024 * 1024,
            'min_width' => 400,
            'min_height' => 400,
            'pref_width' => 600,
            'pref_height' => 600,
            'shape' => 'portrait',
            'capture' => 'user',
            'required' => true,
        ],
        'shop' => [
            'label' => 'Vendor shop front photo',
            'folder' => 'shop',
            'max_bytes' => 10 * 1024 * 1024,
            'min_width' => 800,
            'min_height' => 600,
            'pref_width' => 1920,
            'pref_height' => 1080,
            'shape' => 'landscape',
            'capture' => 'environment',
            'required' => true,
        ],
        'product' => [
            'label' => 'Extra shop photo',
            'folder' => 'products',
            'max_bytes' => 10 * 1024 * 1024,
            'min_width' => 600,
            'min_height' => 400,
            'pref_width' => 1600,
            'pref_height' => 1200,
            'shape' => 'landscape',
            'capture' => 'environment',
            'required' => false,
            'max_files' => 5,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Survey option catalogues
    |--------------------------------------------------------------------------
    |
    | The reference app seeds these into `survey_categories` and reads them
    | with `lookup()` (with a hard-coded fallback). Fino has no such lookup
    | table, so the lists live here and are served to the wizard via
    | GET vendors/certifications/metadata.
    |
    */
    'catalogues' => [
        'business_type' => [
            'Food & Beverages', 'Fruits & Vegetables', 'Clothing & Textiles', 'Footwear',
            'Electronics & Mobile Accessories', 'Household Items', 'Flowers & Plants',
            'Handicraft', 'Repair & Services', 'Other',
        ],
        'vendor_category' => [
            'Stationary Vendor', 'Mobile Vendor (Cart)', 'Street Hawker', 'Kiosk Owner',
            'Weekly Market Vendor',
        ],
        'social_category' => ['General', 'OBC', 'SC', 'ST', 'EWS'],
        'education' => [
            'No Formal Education', 'Primary', 'Secondary (10th)', 'Higher Secondary (12th)',
            'Graduate', 'Post Graduate',
        ],
        'occupation' => [
            'Street Vendor', 'Food Vendor', 'Tea Stall', 'Fruit Seller', 'Vegetable Seller',
            'Flower Seller', 'Pan Shop', 'General Store', 'Tailor', 'Barber', 'Mechanic',
            'Repair Shop', 'Others',
        ],
        'ownership' => ['Owned', 'Rental', 'Government Allotted', 'Other'],
        'weekly_holiday' => [
            'None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Map / geocoding
    |--------------------------------------------------------------------------
    |
    | Mirrors config/config.php's map block. Leave MAPBOX_TOKEN empty to use
    | key-free OpenStreetMap tiles + Nominatim geocoding (the source app's
    | default fallback).
    |
    */
    'map' => [
        'provider' => env('VENDOR_MAP_PROVIDER', 'osm'),
        'mapbox_token' => env('VENDOR_MAPBOX_TOKEN', ''),
        'default_lat' => (float) env('VENDOR_MAP_DEFAULT_LAT', 21.1458),
        'default_lng' => (float) env('VENDOR_MAP_DEFAULT_LNG', 79.0882),
        'default_zoom' => (int) env('VENDOR_MAP_DEFAULT_ZOOM', 15),
        'good_accuracy' => (int) env('VENDOR_MAP_GOOD_ACCURACY', 50),
    ],

];
