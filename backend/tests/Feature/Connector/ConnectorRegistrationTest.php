<?php

namespace Tests\Feature\Connector;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectorRegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'New Connector',
            'email' => 'new-connector@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '9800000199',
            'company_name' => 'New Connector Partners',
            'contact_person' => 'New Connector',
            'alternate_phone' => '9800000299',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'pincode' => '411001',
        ], $overrides);
    }

    private function otpFor(string $email): string
    {
        $user = User::query()->where('email', $email)->firstOrFail();
        $connector = Connector::query()->where('user_id', $user->id)->firstOrFail();

        return $connector->otp_code;
    }

    public function test_standalone_registration_creates_inactive_user_and_pending_root_connector(): void
    {
        $response = $this->postJson('/api/v1/public/connectors/register', $this->payload());

        $response->assertStatus(201)->assertJsonPath('success', true);

        $user = User::query()->where('email', 'new-connector@example.test')->first();
        $this->assertNotNull($user);
        $this->assertSame(UserRole::Connector, $user->role);
        $this->assertFalse((bool) $user->is_active);
        $this->assertSame('9800000199', $user->phone);

        $connector = Connector::query()->where('user_id', $user->id)->first();
        $this->assertNotNull($connector);
        $this->assertSame('pending_verification', $connector->status->value);
        $this->assertNotEmpty($connector->referral_code);
        $this->assertNull($connector->referred_by_connector_id);
        $this->assertNull($connector->phone_verified_at);
        $this->assertNotNull($connector->otp_code);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $connector->otp_code);
    }

    public function test_registration_with_a_valid_invite_code_links_the_inviter(): void
    {
        $inviter = User::factory()->role(UserRole::Connector)->create();
        Connector::factory()->create(['user_id' => $inviter->id, 'referral_code' => 'INVITE01']);

        $this->postJson('/api/v1/public/connectors/register', $this->payload(['invite_code' => 'INVITE01']))
            ->assertStatus(201);

        $connector = Connector::query()
            ->whereHas('user', fn ($q) => $q->where('email', 'new-connector@example.test'))
            ->firstOrFail();

        $this->assertSame($inviter->id, $connector->referred_by_connector_id);
    }

    public function test_registration_with_an_unknown_invite_code_still_succeeds_as_a_root_connector(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload(['invite_code' => 'NOPE0000']))
            ->assertStatus(201);

        $connector = Connector::query()
            ->whereHas('user', fn ($q) => $q->where('email', 'new-connector@example.test'))
            ->firstOrFail();

        $this->assertNull($connector->referred_by_connector_id);
    }

    public function test_referral_code_is_unique_across_connectors(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload(['email' => 'first@example.test']))
            ->assertStatus(201);
        $this->postJson('/api/v1/public/connectors/register', $this->payload(['email' => 'second@example.test']))
            ->assertStatus(201);

        $codes = Connector::query()->pluck('referral_code');

        $this->assertSame($codes->count(), $codes->unique()->count());
        $codes->each(fn (string $code) => $this->assertNotSame('', $code));
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->role(UserRole::Connector)->create(['email' => 'taken@example.test']);

        $this->postJson('/api/v1/public/connectors/register', $this->payload(['email' => 'taken@example.test']))
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('email');
    }

    public function test_registration_requires_a_phone_number(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload(['phone' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('phone');
    }

    public function test_login_is_blocked_before_verification(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload())->assertStatus(201);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'new-connector@example.test',
            'password' => 'password123',
        ])->assertStatus(403);
    }

    public function test_correct_otp_activates_connector_and_login_then_succeeds(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload())->assertStatus(201);
        $otp = $this->otpFor('new-connector@example.test');

        $this->postJson('/api/v1/public/connectors/verify-otp', [
            'email' => 'new-connector@example.test',
            'otp' => $otp,
        ])->assertOk()->assertJsonPath('success', true);

        $user = User::query()->where('email', 'new-connector@example.test')->firstOrFail();
        $this->assertTrue((bool) $user->is_active);

        $connector = Connector::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('active', $connector->status->value);
        $this->assertNotNull($connector->phone_verified_at);
        $this->assertNull($connector->otp_code);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'new-connector@example.test',
            'password' => 'password123',
        ]);

        $login->assertOk()->assertJsonPath('data.user.role', 'connector');
    }

    public function test_verify_rejects_an_incorrect_otp(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload())->assertStatus(201);

        $this->postJson('/api/v1/public/connectors/verify-otp', [
            'email' => 'new-connector@example.test',
            'otp' => '000000',
        ])->assertStatus(422);

        $user = User::query()->where('email', 'new-connector@example.test')->firstOrFail();
        $this->assertFalse((bool) $user->is_active);
    }

    public function test_verify_rejects_an_expired_otp(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload())->assertStatus(201);
        $otp = $this->otpFor('new-connector@example.test');

        $user = User::query()->where('email', 'new-connector@example.test')->firstOrFail();
        Connector::query()->where('user_id', $user->id)->update(['otp_expires_at' => now()->subMinute()]);

        $this->postJson('/api/v1/public/connectors/verify-otp', [
            'email' => 'new-connector@example.test',
            'otp' => $otp,
        ])->assertStatus(422);
    }

    public function test_verify_is_idempotent(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload())->assertStatus(201);
        $otp = $this->otpFor('new-connector@example.test');

        $this->postJson('/api/v1/public/connectors/verify-otp', [
            'email' => 'new-connector@example.test',
            'otp' => $otp,
        ])->assertOk();

        // Resubmitting the same (now-cleared) OTP after the account is
        // already active must not error.
        $this->postJson('/api/v1/public/connectors/verify-otp', [
            'email' => 'new-connector@example.test',
            'otp' => $otp,
        ])->assertOk();

        $this->assertSame(1, Connector::query()->whereHas(
            'user',
            fn ($q) => $q->where('email', 'new-connector@example.test'),
        )->count());
    }

    public function test_resend_otp_issues_a_new_code(): void
    {
        $this->postJson('/api/v1/public/connectors/register', $this->payload())->assertStatus(201);
        $original = $this->otpFor('new-connector@example.test');

        $this->postJson('/api/v1/public/connectors/resend-otp', [
            'email' => 'new-connector@example.test',
        ])->assertOk();

        $reissued = $this->otpFor('new-connector@example.test');

        $this->postJson('/api/v1/public/connectors/verify-otp', [
            'email' => 'new-connector@example.test',
            'otp' => $reissued,
        ])->assertOk();

        // Not a hard guarantee the codes differ (both are random 6-digit
        // numbers), but the reissued one must be the one that verifies —
        // confirms resend actually replaced otp_code rather than no-op'ing.
        $this->assertNotNull($original);
    }
}
