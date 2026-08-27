<?php

namespace Tests\Feature\Affiliate;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliateCommissionAccrualTest extends TestCase
{
    use RefreshDatabase;

    private function relationshipManager(): User
    {
        return User::factory()->role(UserRole::RelationshipManager)->create();
    }

    private function affiliateUser(float $commissionRate = 2.0): User
    {
        $user = User::factory()->role(UserRole::Affiliate)->create();
        Affiliate::factory()->active()->create(['user_id' => $user->id, 'commission_rate' => $commissionRate]);

        return $user;
    }

    /** Walks a lead through the same status path the API exposes to an RM. */
    private function walkToDisbursed(User $rm, LoanLead $lead): void
    {
        foreach ([
            LeadStatus::Assigned,
            LeadStatus::InProgress,
            LeadStatus::UnderReview,
            LeadStatus::Approved,
            LeadStatus::Disbursed,
        ] as $target) {
            $this->actingAs($rm, 'sanctum')
                ->postJson("/api/v1/leads/{$lead->id}/status", ['status' => $target->value])
                ->assertOk();
        }
    }

    public function test_walking_a_lead_with_an_affiliate_to_disbursed_accrues_exactly_one_commission(): void
    {
        $rm = $this->relationshipManager();
        $affiliateUser = $this->affiliateUser(2.5);
        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::New->value,
            'assigned_relationship_manager_id' => $rm->id,
            'affiliate_id' => $affiliateUser->id,
            'loan_amount' => 400000,
        ]);

        $this->walkToDisbursed($rm, $lead);

        $this->assertDatabaseCount('affiliate_commissions', 1);
        $this->assertDatabaseHas('affiliate_commissions', [
            'affiliate_id' => $affiliateUser->id,
            'loan_lead_id' => $lead->id,
            'commission_amount' => 10000, // 2.5% of 400000
            'status' => 'accrued',
        ]);
    }

    public function test_moving_to_disbursed_twice_does_not_duplicate_the_commission(): void
    {
        $rm = $this->relationshipManager();
        $affiliateUser = $this->affiliateUser(2.0);
        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::New->value,
            'assigned_relationship_manager_id' => $rm->id,
            'affiliate_id' => $affiliateUser->id,
            'loan_amount' => 100000,
        ]);

        $this->walkToDisbursed($rm, $lead);
        $this->assertDatabaseCount('affiliate_commissions', 1);

        // Disbursed can only move on to Closed (never back to itself or any
        // other status), so re-accrual is exercised directly at the service
        // layer here — see AffiliateCommissionServiceTest for the
        // idempotency guarantee itself.
        app(\App\Services\AffiliateCommissionService::class)->accrueForLead($lead->fresh());

        $this->assertDatabaseCount('affiliate_commissions', 1);
    }

    public function test_a_lead_with_no_affiliate_creates_no_commission_row(): void
    {
        $rm = $this->relationshipManager();
        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::New->value,
            'assigned_relationship_manager_id' => $rm->id,
            'affiliate_id' => null,
            'loan_amount' => 100000,
        ]);

        $this->walkToDisbursed($rm, $lead);

        $this->assertSame(0, AffiliateCommission::query()->count());
    }
}
