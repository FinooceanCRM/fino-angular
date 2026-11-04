<?php

return [
    /*
    | Whether a visitor without an account may submit a loan inquiry through
    | POST /public/inquiries. OFF by default: the website only lets visitors
    | check eligibility, and applying requires a customer account so the
    | application is always tied to that customer's dashboard.
    |
    | Turn on (WEBSITE_ANONYMOUS_INQUIRIES=true) only if the business wants
    | an account-free "request a callback" again.
    */
    'anonymous_inquiries' => (bool) env('WEBSITE_ANONYMOUS_INQUIRIES', false),
];
