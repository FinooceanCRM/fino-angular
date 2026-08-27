<?php

namespace Tests\Feature\Affiliate;

use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\User;
use App\Notifications\AffiliateVerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AffiliateRegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'New Affiliate',
            'email' => 'new-affiliate@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'alternate_phone' => '9800000199',
            'payout_method' => 'bank_transfer',
            'payout_account_name' => 'New Affiliate',
            'payout_account_number' => '111122223333',
            'payout_ifsc_or_upi' => 'HDFC0009999',
        ], $overrides);
    }

    private function verificationUrlFor(User $user): string
    {
        return URL::temporarySignedRoute(
            'api.v1.public.affiliates.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );
    }

    public function test_successful_registration_creates_inactive_user_and_pending_affiliate(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/public/affiliates/register', $this->payload());

        $response->assertStatus(201)->assertJsonPath('success', true);

        $user = User::query()->where('email', 'new-affiliate@example.test')->first();
        $this->assertNotNull($user);
        $this->assertSame(UserRole::Affiliate, $user->role);
        $this->assertFalse((bool) $user->is_active);

        $affiliate = Affiliate::query()->where('user_id', $user->id)->first();
        $this->assertNotNull($affiliate);
        $this->assertSame('pending_verification', $affiliate->status->value);
        $this->assertNotEmpty($affiliate->referral_code);
        $this->assertNull($affiliate->email_verified_at);

        Notification::assertSentTo($user, AffiliateVerifyEmail::class);
    }

    public function test_referral_code_is_unique_across_affiliates(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/public/affiliates/register', $this->payload(['email' => 'first@example.test']))
            ->assertStatus(201);
        $this->postJson('/api/v1/public/affiliates/register', $this->payload(['email' => 'second@example.test']))
            ->assertStatus(201);

        $codes = Affiliate::query()->pluck('referral_code');

        $this->assertSame($codes->count(), $codes->unique()->count());
        $codes->each(fn (string $code) => $this->assertNotSame('', $code));
    }

    public function test_duplicate_email_is_rejected(): void
    {
        Notification::fake();
        User::factory()->role(UserRole::Affiliate)->create(['email' => 'taken@example.test']);

        $this->postJson('/api/v1/public/affiliates/register', $this->payload(['email' => 'taken@example.test']))
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_is_blocked_before_verification(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/public/affiliates/register', $this->payload())->assertStatus(201);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'new-affiliate@example.test',
            'password' => 'password123',
        ])->assertStatus(403);
    }

    public function test_verify_link_activates_affiliate_and_login_then_succeeds(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/public/affiliates/register', $this->payload())->assertStatus(201);
        $user = User::query()->where('email', 'new-affiliate@example.test')->firstOrFail();

        $this->getJson($this->verificationUrlFor($user))
            ->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertTrue((bool) $user->is_active);

        $affiliate = Affiliate::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('active', $affiliate->status->value);
        $this->assertNotNull($affiliate->email_verified_at);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'new-affiliate@example.test',
            'password' => 'password123',
        ]);

        $login->assertOk()->assertJsonPath('data.user.role', 'affiliate');

        $token = $login->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.role', 'affiliate');
    }

    public function test_verify_rejects_tampered_signature(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/public/affiliates/register', $this->payload())->assertStatus(201);
        $user = User::query()->where('email', 'new-affiliate@example.test')->firstOrFail();

        $this->getJson("/api/v1/public/affiliates/verify/{$user->id}/not-the-real-hash?expires=9999999999&signature=bogus")
            ->assertStatus(403);
    }

    public function test_verify_is_idempotent(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/public/affiliates/register', $this->payload())->assertStatus(201);
        $user = User::query()->where('email', 'new-affiliate@example.test')->firstOrFail();

        $url = $this->verificationUrlFor($user);

        $this->getJson($url)->assertOk();
        $this->getJson($url)->assertOk();

        $this->assertSame(1, Affiliate::query()->where('user_id', $user->id)->count());
    }
}
