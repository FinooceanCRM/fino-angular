<?php

namespace Tests\Feature\Public;

use App\Enums\LeadStatus;
use App\Models\Affiliate;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicLeadCaptureTest extends TestCase
{
    use RefreshDatabase;

    private function fakeCaptcha(bool $passes = true): void
    {
        $this->mock(CaptchaVerifierInterface::class, function ($mock) use ($passes): void {
            $mock->shouldReceive('verify')->andReturn($passes);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'applicant_name' => 'Referred Applicant',
            'applicant_email' => 'referred@example.test',
            'applicant_phone' => '9800000200',
            'loan_type' => 'personal',
            'loan_amount' => 250000,
            'city' => 'Pune',
            'captcha_token' => 'valid-token',
        ], $overrides);
    }

    public function test_valid_submission_with_real_referral_code_attributes_the_lead(): void
    {
        $this->fakeCaptcha(true);

        $affiliateUser = User::factory()->role(\App\Enums\UserRole::Affiliate)->create();
        Affiliate::factory()->active()->create([
            'user_id' => $affiliateUser->id,
            'referral_code' => 'REF12345',
        ]);

        $response = $this->postJson('/api/v1/public/leads', $this->payload(['referral_code' => 'REF12345']));

        $response->assertStatus(201)->assertJsonPath('success', true);

        $lead = LoanLead::query()->where('applicant_email', 'referred@example.test')->first();
        $this->assertNotNull($lead);
        $this->assertSame($affiliateUser->id, $lead->affiliate_id);
        $this->assertSame(LeadStatus::New, $lead->status);
        $this->assertNull($lead->connector_id);
        $this->assertNull($lead->created_by);

        $this->assertDatabaseHas('lead_status_history', [
            'loan_lead_id' => $lead->id,
            'to_status' => LeadStatus::New->value,
            'changed_by' => null,
        ]);
    }

    public function test_invalid_or_missing_referral_code_still_creates_lead_unattributed(): void
    {
        $this->fakeCaptcha(true);

        $response = $this->postJson('/api/v1/public/leads', $this->payload([
            'applicant_email' => 'no-code@example.test',
            'referral_code' => 'DOES-NOT-EXIST',
        ]));

        $response->assertStatus(201);

        $lead = LoanLead::query()->where('applicant_email', 'no-code@example.test')->first();
        $this->assertNotNull($lead);
        $this->assertNull($lead->affiliate_id);

        $response2 = $this->postJson('/api/v1/public/leads', $this->payload(['applicant_email' => 'omitted@example.test']));
        $response2->assertStatus(201);

        $lead2 = LoanLead::query()->where('applicant_email', 'omitted@example.test')->first();
        $this->assertNotNull($lead2);
        $this->assertNull($lead2->affiliate_id);
    }

    public function test_honeypot_filled_returns_201_but_persists_nothing(): void
    {
        $this->fakeCaptcha(true);

        $before = LoanLead::query()->count();

        $this->postJson('/api/v1/public/leads', $this->payload(['website' => 'https://spam.example']))
            ->assertStatus(201);

        $this->assertSame($before, LoanLead::query()->count());
    }

    public function test_failed_captcha_returns_422(): void
    {
        $this->fakeCaptcha(false);

        $this->postJson('/api/v1/public/leads', $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertSame(0, LoanLead::query()->count());
    }

    public function test_rate_limit_trips_after_configured_threshold(): void
    {
        $this->fakeCaptcha(true);

        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/v1/public/leads', $this->payload([
                'applicant_email' => "bulk{$i}@example.test",
            ]))->assertStatus(201);
        }

        $this->postJson('/api/v1/public/leads', $this->payload(['applicant_email' => 'over-limit@example.test']))
            ->assertStatus(429);
    }
}
