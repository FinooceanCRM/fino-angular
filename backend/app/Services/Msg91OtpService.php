<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper around MSG91's Send OTP API. The backend stays the source of
 * truth for the OTP value and its expiry (see Vendor/Banker/Connector
 * RegistrationService@generateOtp) — this only relays an already-generated
 * code to MSG91 for SMS delivery via the `otp` parameter, which tells MSG91
 * to send that exact code instead of generating its own.
 *
 * Shared by all three self-service signup flows (Vendor, Banker, Connector)
 * since they use the same DLT-approved OTP template.
 */
class Msg91OtpService
{
    private const ENDPOINT = 'https://control.msg91.com/api/v5/otp';

    /**
     * Sends `$otp` to `$phone` by SMS. Failures are logged, not thrown — a
     * delivery hiccup must not roll back a registration that already
     * happened; the user can always hit "resend".
     */
    public function send(?string $phone, string $otp, int $expiryMinutes): void
    {
        if (blank($phone)) {
            Log::warning('MSG91 OTP not sent: no phone number on the account.');

            return;
        }

        $authKey = config('services.msg91.auth_key');
        $templateId = config('services.msg91.otp_template_id');

        if (blank($authKey) || blank($templateId)) {
            Log::warning('MSG91 is not configured (MSG91_AUTH_KEY / MSG91_OTP_TEMPLATE_ID missing); OTP was not sent.', [
                'phone' => $phone,
            ]);

            return;
        }

        $query = http_build_query([
            'template_id' => $templateId,
            'mobile' => $this->toInternationalFormat($phone),
            'otp' => $otp,
            'otp_expiry' => $expiryMinutes,
            'otp_length' => strlen($otp),
        ]);

        $response = Http::withHeaders(['authkey' => $authKey])->post(self::ENDPOINT.'?'.$query);

        if ($response->failed() || $response->json('type') === 'error') {
            Log::error('MSG91 OTP send failed.', [
                'phone' => $phone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }
    }

    /**
     * MSG91 requires the mobile number in international format. Local
     * registration forms only collect a bare Indian number, so a 10-digit
     * value is assumed to need the `91` country code prefixed; anything
     * already longer is trusted as-is.
     */
    private function toInternationalFormat(string $phone): string
    {
        return strlen($phone) === 10 ? '91'.$phone : $phone;
    }
}
