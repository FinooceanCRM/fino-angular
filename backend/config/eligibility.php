<?php

/*
|--------------------------------------------------------------------------
| Preliminary eligibility rules (public website)
|--------------------------------------------------------------------------
|
| PLACEHOLDER business rules — they exist so the website's eligibility
| checker is a real, testable calculation, but they have NOT been approved by
| FINOOCEAN's credit team or any lender. The checker only ever reports an
| *indicative* band; it never approves, rejects or promises a loan.
|
| foir          Maximum share of net monthly income that may go to EMIs.
| assumed_rate  Annual interest rate (%) used ONLY to size an indicative
|               affordable amount. It is not an offer or a quoted rate.
| min_income    Monthly income below which the profile is flagged for review.
| max_tenure_months
*/

return [
    'foir' => 0.50,
    'default_tenure_months' => 60,

    'defaults' => [
        'assumed_rate' => 12.0,
        'min_income' => 15000,
        'max_tenure_months' => 84,
    ],

    // Per-LoanType overrides; anything absent uses `defaults`.
    'types' => [
        'home' => ['assumed_rate' => 9.0, 'min_income' => 20000, 'max_tenure_months' => 360],
        'loan_against_property' => ['assumed_rate' => 10.0, 'min_income' => 25000, 'max_tenure_months' => 180],
        'personal' => ['assumed_rate' => 13.0, 'min_income' => 18000, 'max_tenure_months' => 72],
        'auto' => ['assumed_rate' => 10.0, 'min_income' => 18000, 'max_tenure_months' => 84],
        'education' => ['assumed_rate' => 10.0, 'min_income' => 0, 'max_tenure_months' => 120],
        'gold_loan' => ['assumed_rate' => 11.0, 'min_income' => 0, 'max_tenure_months' => 36],
        'business' => ['assumed_rate' => 14.0, 'min_income' => 20000, 'max_tenure_months' => 84],
    ],
];
