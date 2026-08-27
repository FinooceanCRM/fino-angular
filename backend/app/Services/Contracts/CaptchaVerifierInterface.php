<?php

namespace App\Services\Contracts;

interface CaptchaVerifierInterface
{
    /**
     * Verifies a captcha challenge token with the provider. Returns false
     * on any failure — invalid token, unreachable provider, missing secret.
     */
    public function verify(string $token, ?string $ip = null): bool;
}
