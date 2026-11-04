<?php

namespace Tests\Feature\Portal;

use App\Models\LoanLead;
use App\Models\User;
use App\Services\PhoneOtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Mobile-number OTP and the extra answers collected by the step-by-step application. */
class CustomerApplyFlowTest extends TestCase
{
    use RefreshDatabase;

    private const PHONE = '9876543210';

    private function customer(string $email = 'c1@example.test'): User
    {
        $this->postJson('/api/v1/customer/auth/register', [
            'name' => 'Rohan Sharma', 'email' => $email, 'phone' => self::PHONE,
            'password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh', 'terms' => true,
        ])->assertCreated();

        return User::query()->where('email', $email)->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function payload(array $o = []): array
    {
        return array_merge([
            'product' => 'personal-loan', 'loan_amount' => 500000, 'tenure_months' => 36, 'monthly_income' => 75000,
            'city' => 'Nagpur', 'applicant_phone' => self::PHONE, 'consent' => true,
        ], $o);
    }

    private function sendCode(): string
    {
        return $this->postJson('/api/v1/customer/otp/send', ['phone' => self::PHONE])->assertOk()->json('data.dev_code');
    }

    // ── otp: send ──────────────────────────────────────────────────────────────

    public function test_otp_endpoints_require_login(): void
    {
        $this->postJson('/api/v1/customer/otp/send', ['phone' => self::PHONE])->assertUnauthorized();
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => '123456'])->assertUnauthorized();
    }

    public function test_staff_cannot_use_otp_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'employee']));
        $this->postJson('/api/v1/customer/otp/send', ['phone' => self::PHONE])->assertForbidden();
    }

    public function test_send_returns_timings_and_a_six_digit_code_outside_production(): void
    {
        Sanctum::actingAs($this->customer());
        $res = $this->postJson('/api/v1/customer/otp/send', ['phone' => self::PHONE])->assertOk();
        $this->assertSame(300, $res->json('data.expires_in'));
        $this->assertSame(30, $res->json('data.resend_in'));
        $this->assertMatchesRegularExpression('/^\d{6}$/', $res->json('data.dev_code'));
    }

    public function test_send_rejects_a_bad_phone_number(): void
    {
        Sanctum::actingAs($this->customer());
        $this->postJson('/api/v1/customer/otp/send', ['phone' => '123'])->assertStatus(422)->assertJsonValidationErrors('phone');
        $this->postJson('/api/v1/customer/otp/send', [])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_a_second_send_within_30_seconds_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        $this->sendCode();
        $this->postJson('/api/v1/customer/otp/send', ['phone' => self::PHONE])->assertStatus(429);
    }

    public function test_a_new_code_can_be_requested_after_30_seconds(): void
    {
        Sanctum::actingAs($this->customer());
        $first = $this->sendCode();
        $this->travel(31)->seconds();
        $second = $this->sendCode();
        $this->assertNotEmpty($second);
        // the first code is replaced by the second
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $second])->assertOk();
        $this->assertNotNull($first);
    }

    public function test_sending_is_refused_in_production_because_no_sms_provider_exists(): void
    {
        Sanctum::actingAs($this->customer());
        $this->app->detectEnvironment(static fn () => 'production');
        $this->postJson('/api/v1/customer/otp/send', ['phone' => self::PHONE])->assertStatus(503);
    }

    // ── otp: verify ────────────────────────────────────────────────────────────

    public function test_the_right_code_returns_a_token(): void
    {
        Sanctum::actingAs($this->customer());
        $code = $this->sendCode();
        $token = $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $code])->assertOk()->json('data.otp_token');
        $this->assertSame(40, strlen($token));
    }

    public function test_a_wrong_code_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        $code = $this->sendCode();
        $wrong = $code === '000000' ? '111111' : '000000';
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $wrong])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_the_code_is_malformed_when_not_six_digits(): void
    {
        Sanctum::actingAs($this->customer());
        $this->sendCode();
        foreach (['12345', '1234567', 'abcdef', ''] as $bad) {
            $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $bad])->assertStatus(422);
        }
    }

    public function test_verify_without_a_prior_send_fails(): void
    {
        Sanctum::actingAs($this->customer());
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => '123456'])->assertStatus(422);
    }

    public function test_five_wrong_tries_burn_the_code_even_if_the_sixth_is_right(): void
    {
        Sanctum::actingAs($this->customer());
        $code = $this->sendCode();
        $wrong = $code === '000000' ? '111111' : '000000';
        for ($i = 0; $i < PhoneOtpService::MAX_ATTEMPTS; $i++) {
            $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $wrong])->assertStatus(422);
        }
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $code])->assertStatus(429);
        // and it stays dead: a fresh code is needed
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $code])->assertStatus(422);
    }

    public function test_the_code_expires_after_five_minutes(): void
    {
        Sanctum::actingAs($this->customer());
        $code = $this->sendCode();
        $this->travel(6)->minutes();
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $code])->assertStatus(422);
    }

    public function test_a_code_works_only_once(): void
    {
        Sanctum::actingAs($this->customer());
        $code = $this->sendCode();
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $code])->assertOk();
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $code])->assertStatus(422);
    }

    public function test_a_code_for_one_number_does_not_verify_another(): void
    {
        Sanctum::actingAs($this->customer());
        $code = $this->sendCode();
        $this->postJson('/api/v1/customer/otp/verify', ['phone' => '9123456780', 'code' => $code])->assertStatus(422);
    }

    public function test_the_code_is_never_stored_in_clear(): void
    {
        $user = $this->customer();
        Sanctum::actingAs($user);
        $code = $this->sendCode();
        $stored = Cache::get("otp:code:{$user->id}:".self::PHONE);
        $this->assertIsArray($stored);
        $this->assertStringNotContainsString($code, json_encode($stored));
    }

    // ── apply with the extra details ───────────────────────────────────────────

    public function test_a_verified_token_marks_the_phone_verified_on_the_application(): void
    {
        Sanctum::actingAs($this->customer());
        $token = $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $this->sendCode()])->json('data.otp_token');

        $id = $this->postJson('/api/v1/customer/applications', $this->payload(['otp_token' => $token]))->assertCreated()->json('data.id');
        $this->assertNotEmpty(LoanLead::query()->findOrFail($id)->details['phone_verified_at'] ?? null);
    }

    public function test_an_unknown_or_missing_token_just_leaves_the_phone_unverified(): void
    {
        Sanctum::actingAs($this->customer());
        $id = $this->postJson('/api/v1/customer/applications', $this->payload(['otp_token' => 'nope']))->assertCreated()->json('data.id');
        $this->assertArrayNotHasKey('phone_verified_at', LoanLead::query()->findOrFail($id)->details);
    }

    public function test_another_customers_token_cannot_be_used(): void
    {
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        Sanctum::actingAs($a);
        $token = $this->postJson('/api/v1/customer/otp/verify', ['phone' => self::PHONE, 'code' => $this->sendCode()])->json('data.otp_token');

        Sanctum::actingAs($b);
        $id = $this->postJson('/api/v1/customer/applications', $this->payload(['otp_token' => $token]))->assertCreated()->json('data.id');
        $this->assertArrayNotHasKey('phone_verified_at', LoanLead::query()->findOrFail($id)->details);
    }

    public function test_extra_details_are_saved_and_the_aadhaar_is_only_kept_as_last_four_digits(): void
    {
        Sanctum::actingAs($this->customer());
        $id = $this->postJson('/api/v1/customer/applications', $this->payload([
            'applicant' => ['dob' => '1989-12-07', 'gender' => 'male', 'marital_status' => 'single', 'pan' => 'abcde1234f', 'aadhaar' => '1234 5678 9012'],
            'employment' => ['company' => 'ABC Pvt. Ltd.', 'designation' => 'Senior Executive', 'experience_years' => 5, 'office_address' => '123, Business Park, Nagpur'],
            'loan' => ['purpose' => 'Home Renovation', 'has_existing_loans' => false],
            'employment_type' => 'salaried',
        ]))->assertCreated()->json('data.id');

        $details = LoanLead::query()->findOrFail($id)->details;
        $this->assertSame('ABCDE1234F', $details['applicant']['pan']);
        $this->assertSame('9012', $details['applicant']['aadhaar_last4']);
        $this->assertSame('ABC Pvt. Ltd.', $details['employment']['company']);
        $this->assertSame('Home Renovation', $details['loan']['purpose']);
        $this->assertStringNotContainsString('123456789012', json_encode($details));
        $this->assertSame('personal-loan', $details['product'], 'system keys must survive the merge');
    }

    public function test_extra_details_never_appear_in_the_customer_application_view_beyond_the_safe_fields(): void
    {
        Sanctum::actingAs($this->customer());
        $id = $this->postJson('/api/v1/customer/applications', $this->payload([
            'applicant' => ['pan' => 'ABCDE1234F', 'aadhaar' => '123456789012'],
        ]))->assertCreated()->json('data.id');

        $json = json_encode($this->getJson("/api/v1/customer/applications/{$id}")->assertOk()->json('data'));
        $this->assertStringNotContainsString('ABCDE1234F', $json);
        $this->assertStringNotContainsString('9012', $json);
    }

    public function test_an_invalid_pan_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        foreach (['ABCDE12345', 'ABCD1234F', '12345ABCDE', 'ABCDE1234'] as $bad) {
            $this->postJson('/api/v1/customer/applications', $this->payload(['applicant' => ['pan' => $bad]]))
                ->assertStatus(422)->assertJsonValidationErrors('applicant.pan');
        }
    }

    public function test_an_aadhaar_that_is_not_twelve_digits_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        foreach (['12345678901', '1234567890123', 'abcdefghijkl'] as $bad) {
            $this->postJson('/api/v1/customer/applications', $this->payload(['applicant' => ['aadhaar' => $bad]]))
                ->assertStatus(422)->assertJsonValidationErrors('applicant.aadhaar');
        }
    }

    public function test_an_applicant_under_18_or_with_a_future_birth_date_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        foreach ([now()->subYears(17)->toDateString(), now()->addDay()->toDateString(), '1800-01-01', 'not-a-date'] as $bad) {
            $this->postJson('/api/v1/customer/applications', $this->payload(['applicant' => ['dob' => $bad]]))
                ->assertStatus(422)->assertJsonValidationErrors('applicant.dob');
        }
    }

    public function test_exactly_18_years_old_is_accepted(): void
    {
        Sanctum::actingAs($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->payload(['applicant' => ['dob' => now()->subYears(18)->toDateString()]]))->assertCreated();
    }

    public function test_unknown_gender_or_marital_status_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->payload(['applicant' => ['gender' => 'robot']]))->assertStatus(422);
        $this->postJson('/api/v1/customer/applications', $this->payload(['applicant' => ['marital_status' => 'complicated']]))->assertStatus(422);
    }

    public function test_out_of_range_experience_is_refused(): void
    {
        Sanctum::actingAs($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->payload(['employment' => ['experience_years' => 61]]))->assertStatus(422);
        $this->postJson('/api/v1/customer/applications', $this->payload(['employment' => ['experience_years' => -1]]))->assertStatus(422);
    }

    // ── duplicate handling must never cross customers ─────────────────────────

    public function test_a_second_customer_with_the_same_phone_gets_their_own_application_not_the_first_ones(): void
    {
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');

        Sanctum::actingAs($a);
        $idA = $this->postJson('/api/v1/customer/applications', $this->payload(['product' => 'home-loan', 'loan_amount' => 2500000]))->assertCreated()->json('data.id');

        Sanctum::actingAs($b);
        $res = $this->postJson('/api/v1/customer/applications', $this->payload(['product' => 'home-loan', 'loan_amount' => 900000]))->assertCreated();

        $this->assertNotSame($idA, $res->json('data.id'), 'B must get a new application, not A\'s');
        $this->assertEquals(900000, $res->json('data.loan_amount'), 'B must never be shown A\'s amount');
        $this->assertSame(0, LoanLead::query()->findOrFail($idA)->resubmission_count, 'A\'s lead must not be touched');
        $this->assertSame($a->id, LoanLead::query()->findOrFail($idA)->customer->user_id);
        $this->assertSame($b->id, LoanLead::query()->findOrFail($res->json('data.id'))->customer->user_id);

        // and B can read their own, but not A's
        $this->getJson('/api/v1/customer/applications/'.$res->json('data.id'))->assertOk();
        $this->getJson("/api/v1/customer/applications/{$idA}")->assertNotFound();
    }

    public function test_the_same_customer_applying_twice_for_the_same_loan_gets_their_existing_application(): void
    {
        Sanctum::actingAs($this->customer());
        $first = $this->postJson('/api/v1/customer/applications', $this->payload())->assertCreated()->json('data.id');
        $second = $this->postJson('/api/v1/customer/applications', $this->payload())->assertCreated()->json('data.id');
        $this->assertSame($first, $second);
        $this->assertSame(1, LoanLead::query()->count());
    }

    public function test_an_application_without_any_extra_details_still_works(): void
    {
        Sanctum::actingAs($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->payload())->assertCreated();
    }
}
