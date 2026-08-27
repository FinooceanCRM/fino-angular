<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Commission Rate
    |--------------------------------------------------------------------------
    |
    | Used when an affiliate has no commission_rate of their own set
    | (affiliates.commission_rate is null — see App\Models\Affiliate).
    |
    | Same unit as affiliates.commission_rate: a PERCENTAGE, not a fraction
    | (e.g. 1.00 means 1%, not 100%). This matches the column's decimal(5,2)
    | precision, which comfortably represents percentages like 2.50 or 1.75
    | but is too coarse to represent sub-percent fractions (0.025 for 2.5%
    | would round to 0.03).
    |
    */
    'default_commission_rate' => (float) env('AFFILIATE_DEFAULT_COMMISSION_RATE', 1.00),

];
