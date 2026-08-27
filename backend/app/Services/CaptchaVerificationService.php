<?php

namespace App\Services;

use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin wrapper around hCaptcha's siteverify endpoint. Bound behind
 * {@see CaptchaVerifierInterface} (see AppServiceProvider) so tests and
 * other callers can swap in a fake without making real HTTP calls or
 * needing a live secret key.
 */
class CaptchaVerificationService implements CaptchaVerifierInterface
{
    private const VERIFY_URL = 'https://hcaptcha.com/siteverify';

    public function verify(string $token, ?string $ip = null): bool
    {
        $secret = (string) config('services.captcha.secret');

        if ($secret === '' || $token === '') {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(5)->post(self::VERIFY_URL, array_filter([
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $ip,
            ]));

            return $response->successful() && (bool) $response->json('success', false);
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }
}
