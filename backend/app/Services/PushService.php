<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Sends push notifications through the Firebase Cloud Messaging HTTP v1 API.
 *
 * Deliberately dependency-free: the OAuth2 bearer token for FCM is minted
 * from the service-account JSON by signing a JWT with PHP's own `openssl`
 * (RS256), so no `google/auth` / `kreait` package is required.
 *
 * Configuration (config/services.php → `fcm`):
 *   FCM_PROJECT_ID   the Firebase project id
 *   FCM_CREDENTIALS  absolute path to the service-account JSON key file
 *
 * When either is missing every method is a silent no-op, so the app runs
 * unchanged until push is actually configured. In-app notifications (the
 * `notifications` table + polling) are unaffected either way.
 */
class PushService
{
    private const TOKEN_CACHE_KEY = 'fcm.access_token';
    private const OAUTH_URL = 'https://oauth2.googleapis.com/token';
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    /**
     * Fan a notification out to every registered device of the given users.
     *
     * @param  array<int, int|null>  $userIds
     * @param  array<string, mixed>  $data  routing hints for the tap handler (e.g. ['link' => '/leads/42'])
     */
    public function sendToUsers(array $userIds, string $title, ?string $body = null, array $data = []): void
    {
        $userIds = array_values(array_unique(array_filter($userIds)));

        if ($userIds === [] || ! $this->configured()) {
            return;
        }

        DeviceToken::query()
            ->whereIn('user_id', $userIds)
            ->get()
            ->each(fn (DeviceToken $token) => $this->sendToToken($token, $title, $body, $data));
    }

    private function sendToToken(DeviceToken $device, string $title, ?string $body, array $data): void
    {
        try {
            $response = Http::withToken($this->accessToken())
                ->post("https://fcm.googleapis.com/v1/projects/{$this->projectId()}/messages:send", [
                    'message' => [
                        'token' => $device->token,
                        'notification' => array_filter([
                            'title' => $title,
                            'body' => $body,
                        ]),
                        // FCM requires every data value to be a string.
                        'data' => array_map(static fn ($v) => (string) $v, $data),
                        'android' => ['priority' => 'high'],
                        'apns' => ['headers' => ['apns-priority' => '10']],
                    ],
                ]);

            $errorStatus = $response->json('error.status');

            if (in_array($errorStatus, ['UNREGISTERED', 'INVALID_ARGUMENT', 'NOT_FOUND'], true)
                || $response->status() === 404) {
                // The token is dead (app uninstalled, token rotated) — drop it
                // so we stop trying.
                $device->delete();

                return;
            }

            if ($response->failed()) {
                Log::warning('FCM send failed', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
            } else {
                $device->forceFill(['last_used_at' => now()])->saveQuietly();
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    public function configured(): bool
    {
        $credentials = config('services.fcm.credentials');

        return $this->projectId() !== null
            && is_string($credentials)
            && is_file($credentials);
    }

    private function projectId(): ?string
    {
        $id = config('services.fcm.project_id');

        return is_string($id) && $id !== '' ? $id : null;
    }

    /**
     * A short-lived OAuth2 access token for the FCM HTTP v1 API, obtained
     * via the JWT-bearer grant and cached just under its one-hour lifetime.
     */
    private function accessToken(): string
    {
        return Cache::remember(self::TOKEN_CACHE_KEY, now()->addMinutes(55), function (): string {
            $sa = json_decode(
                (string) file_get_contents((string) config('services.fcm.credentials')),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );

            $now = time();
            $signingInput = $this->b64url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR))
                .'.'
                .$this->b64url((string) json_encode([
                    'iss' => $sa['client_email'],
                    'scope' => self::SCOPE,
                    'aud' => self::OAUTH_URL,
                    'iat' => $now,
                    'exp' => $now + 3600,
                ], JSON_THROW_ON_ERROR));

            openssl_sign($signingInput, $signature, $sa['private_key'], OPENSSL_ALGO_SHA256);
            $jwt = $signingInput.'.'.$this->b64url($signature);

            return Http::asForm()->post(self::OAUTH_URL, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ])->throw()->json('access_token');
        });
    }

    private function b64url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
