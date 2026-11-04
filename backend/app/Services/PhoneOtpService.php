<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * One-time codes that prove a customer controls the mobile number on an application.
 *
 * Codes are stored only as a keyed hash, expire after 5 minutes, allow 5 wrong tries and can be
 * re-sent once every 30 seconds. A successful check returns a short-lived token that the application
 * request can present to have the phone marked as verified.
 *
 * DELIVERY: there is no SMS provider wired up yet. Outside production the code is written to the log
 * (and returned as `dev_code` in local/testing) so the flow can be exercised; in production sending
 * refuses with 503 rather than pretending a message went out. Replace {@see self::deliver()} with a
 * real SMS gateway call before going live.
 */
class PhoneOtpService
{
    public const TTL_SECONDS = 300;
    public const RESEND_SECONDS = 30;
    public const MAX_ATTEMPTS = 5;
    private const TOKEN_TTL_SECONDS = 1800;

    /** @return array{expires_in: int, resend_in: int, dev_code?: string} */
    public function send(User $user, string $phone): array
    {
        $phone = $this->normalise($phone);

        if (! Cache::add($this->key('sent', $user, $phone), 1, self::RESEND_SECONDS)) {
            throw new DomainException('Please wait a few seconds before asking for another code.', 429);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->deliver($phone, $code);

        Cache::put($this->key('code', $user, $phone), ['hash' => $this->hash($code), 'attempts' => 0], self::TTL_SECONDS);

        $out = ['expires_in' => self::TTL_SECONDS, 'resend_in' => self::RESEND_SECONDS];
        if (app()->environment(['local', 'testing'])) {
            $out['dev_code'] = $code;
        }

        return $out;
    }

    /** @return string token to pass with the application request */
    public function verify(User $user, string $phone, string $code): string
    {
        $phone = $this->normalise($phone);
        $key = $this->key('code', $user, $phone);
        $state = Cache::get($key);

        if (! is_array($state)) {
            throw new DomainException('That code has expired. Please request a new one.', 422, ['code' => ['That code has expired. Please request a new one.']]);
        }

        if ((int) $state['attempts'] >= self::MAX_ATTEMPTS) {
            Cache::forget($key);
            throw new DomainException('Too many wrong attempts. Please request a new code.', 429);
        }

        if (! hash_equals((string) $state['hash'], $this->hash($code))) {
            $state['attempts'] = (int) $state['attempts'] + 1;
            Cache::put($key, $state, self::TTL_SECONDS);
            throw new DomainException('That code is not correct.', 422, ['code' => ['That code is not correct.']]);
        }

        Cache::forget($key);
        $token = Str::random(40);
        Cache::put($this->key('ok', $user, $token), $phone, self::TOKEN_TTL_SECONDS);

        return $token;
    }

    /** True once per token when it was issued to this user for this phone. */
    public function consume(User $user, string $phone, ?string $token): bool
    {
        if ($token === null || $token === '') {
            return false;
        }

        $key = $this->key('ok', $user, $token);
        $valid = Cache::get($key) === $this->normalise($phone);
        if ($valid) {
            Cache::forget($key);
        }

        return $valid;
    }

    private function deliver(string $phone, string $code): void
    {
        if (app()->isProduction()) {
            throw new DomainException('Phone verification is not available right now. Please try again later.', 503);
        }

        Log::info(sprintf('[OTP] code for ******%s is %s (not sent — no SMS provider configured)', substr($phone, -4), $code));
    }

    private function normalise(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        return strlen($digits) > 10 ? substr($digits, -10) : $digits;
    }

    private function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }

    private function key(string $kind, User $user, string $suffix): string
    {
        return "otp:{$kind}:{$user->id}:{$suffix}";
    }
}
