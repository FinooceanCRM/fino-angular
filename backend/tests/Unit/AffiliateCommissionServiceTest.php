<?php

namespace Tests\Unit;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\AffiliateCommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliateCommissionServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): AffiliateCommissionService
    {
        return app(AffiliateCommissionService::class);
    }

    private function affiliateUser(?float $commissionRate = null): User
    {
        $user = User::factory()->role(UserRole::Affiliate)->create();
        Affiliate::factory()->active()->create([
            'user_id' => $user->id,
            'commission_rate' => $commissionRate,
        ]);

        return $user;
    }

    public function test_accrues_commission_using_the_affiliates_own_rate(): void
    {
        $affiliateUser = $this->affiliateUser(2.5);
        $lead = LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'loan_amount' => 100000]);

        $commission = $this->service()->accrueForLead($lead);

        $this->assertNotNull($commission);
        $this->assertSame(2500.0, (float) $commission->commission_amount);
        $this->assertSame(2.5, (float) $commission->commission_rate);
        $this->assertSame(AffiliateCommissionStatus::Accrued, $commission->status);
        $this->assertNotNull($commission->accrued_at);
    }

    public function test_falls_back_to_the_global_default_rate_when_affiliate_rate_is_null(): void
    {
        config(['affiliates.default_commission_rate' => 1.5]);

        $affiliateUser = $this->affiliateUser(null);
        $lead = LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'loan_amount' => 200000]);

        $commission = $this->service()->accrueForLead($lead);

        $this->assertNotNull($commission);
        $this->assertSame(3000.0, (float) $commission->commission_amount);
        $this->assertSame(1.5, (float) $commission->commission_rate);
    }

    public function test_is_a_noop_when_the_lead_has_no_affiliate(): void
    {
        $lead = LoanLead::factory()->create(['affiliate_id' => null]);

        $result = $this->service()->accrueForLead($lead);

        $this->assertNull($result);
        $this->assertSame(0, AffiliateCommission::query()->count());
    }

    public function test_is_idempotent_for_the_same_lead(): void
    {
        $affiliateUser = $this->affiliateUser(2.0);
        $lead = LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'loan_amount' => 100000]);

        $first = $this->service()->accrueForLead($lead);
        $second = $this->service()->accrueForLead($lead);

        $this->assertNotNull($first);
        $this->assertNull($second);
        $this->assertSame(1, AffiliateCommission::query()->where('loan_lead_id', $lead->id)->count());
    }
}
