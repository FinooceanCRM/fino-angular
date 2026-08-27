<?php

namespace Tests\Feature\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliatePayoutTest extends TestCase
{
    use RefreshDatabase;

    private function affiliateUser(array $attributes = []): User
    {
        $user = User::factory()->role(UserRole::Affiliate)->create($attributes);
        Affiliate::factory()->active()->create(['user_id' => $user->id, 'payout_method' => 'bank_transfer']);

        return $user;
    }

    private function superAdmin(): User
    {
        return User::factory()->role(UserRole::SuperAdmin)->create();
    }

    private function accrueCommission(User $affiliateUser, float $amount): AffiliateCommission
    {
        // Pinned to 'new' (not the factory's random default) so this lead
        // never accidentally counts as a converted (disbursed) one in
        // test_super_admin_can_list_all_affiliates_with_stats — LoanLeadFactory's
        // status is $this->faker->randomElement(...), which previously made
        // that assertion flaky (~1/9 runs).
        $lead = LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'status' => 'new']);

        return AffiliateCommission::query()->create([
            'affiliate_id' => $affiliateUser->id,
            'loan_lead_id' => $lead->id,
            'commission_rate' => 2.0,
            'commission_amount' => $amount,
            'status' => AffiliateCommissionStatus::Accrued->value,
            'accrued_at' => now(),
        ]);
    }

    public function test_affiliate_can_request_a_payout_summing_accrued_commissions(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);
        $this->accrueCommission($affiliateUser, 500);

        $response = $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts');

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', 1500)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.method', 'bank_transfer');

        $this->assertDatabaseHas('affiliate_payouts', [
            'affiliate_id' => $affiliateUser->id,
            'amount' => 1500,
            'status' => 'pending',
        ]);

        $payout = AffiliatePayout::query()->where('affiliate_id', $affiliateUser->id)->firstOrFail();
        $this->assertSame(2, AffiliateCommission::query()->where('payout_id', $payout->id)->count());
    }

    public function test_cannot_request_a_payout_with_zero_accrued_balance(): void
    {
        $affiliateUser = $this->affiliateUser();

        $this->actingAs($affiliateUser, 'sanctum')
            ->postJson('/api/v1/affiliates/payouts')
            ->assertStatus(422);

        $this->assertSame(0, AffiliatePayout::query()->count());
    }

    public function test_a_second_request_only_covers_newly_accrued_commissions(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);

        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);

        // Requesting again immediately, with nothing new accrued, has nothing to cover.
        $this->actingAs($affiliateUser, 'sanctum')
            ->postJson('/api/v1/affiliates/payouts')
            ->assertStatus(422);

        $this->accrueCommission($affiliateUser, 250);

        $this->actingAs($affiliateUser, 'sanctum')
            ->postJson('/api/v1/affiliates/payouts')
            ->assertStatus(201)
            ->assertJsonPath('data.amount', 250);

        $this->assertSame(2, AffiliatePayout::query()->count());
    }

    public function test_only_super_admin_can_approve_or_reject_a_payout(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);
        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);
        $payout = AffiliatePayout::query()->where('affiliate_id', $affiliateUser->id)->firstOrFail();

        // The affiliate themselves may not decide their own payout.
        $this->actingAs($affiliateUser, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/approve")
            ->assertStatus(403);

        foreach ([UserRole::Manager, UserRole::RelationshipManager, UserRole::Employee, UserRole::Connector] as $role) {
            $user = User::factory()->role($role)->create();
            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/approve")
                ->assertStatus(403);
        }

        $admin = $this->superAdmin();
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');
    }

    public function test_approving_flips_commission_rows_to_paid(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);
        $this->accrueCommission($affiliateUser, 500);
        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);
        $payout = AffiliatePayout::query()->where('affiliate_id', $affiliateUser->id)->firstOrFail();

        $admin = $this->superAdmin();
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/approve")
            ->assertOk();

        $this->assertSame(
            2,
            AffiliateCommission::query()->where('payout_id', $payout->id)->where('status', 'paid')->count(),
        );
        $this->assertDatabaseHas('affiliate_payouts', ['id' => $payout->id, 'status' => 'processing']);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/mark-paid")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('affiliate_payouts', ['id' => $payout->id, 'status' => 'paid']);
    }

    public function test_rejecting_reverts_commission_rows_to_accrued(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);
        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);
        $payout = AffiliatePayout::query()->where('affiliate_id', $affiliateUser->id)->firstOrFail();

        $admin = $this->superAdmin();
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/reject", [
                'reason' => 'Bank details could not be verified.',
            ]);

        $response->assertOk()->assertJsonPath('data.status', 'failed');

        $this->assertDatabaseHas('affiliate_payouts', [
            'id' => $payout->id,
            'status' => 'failed',
            'failure_reason' => 'Bank details could not be verified.',
        ]);

        $commissions = AffiliateCommission::query()->where('affiliate_id', $affiliateUser->id)->get();
        $this->assertCount(1, $commissions);
        $this->assertSame('accrued', $commissions->first()->status->value);
        $this->assertNull($commissions->first()->payout_id);

        // The reverted commission is now eligible for a fresh payout request.
        $this->actingAs($affiliateUser, 'sanctum')
            ->postJson('/api/v1/affiliates/payouts')
            ->assertStatus(201)
            ->assertJsonPath('data.amount', 1000);
    }

    public function test_reject_requires_a_reason(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);
        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);
        $payout = AffiliatePayout::query()->where('affiliate_id', $affiliateUser->id)->firstOrFail();

        $this->actingAs($this->superAdmin(), 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/reject")
            ->assertStatus(422);
    }

    public function test_affiliate_can_view_own_payout_history(): void
    {
        $affiliateUser = $this->affiliateUser();
        $this->accrueCommission($affiliateUser, 1000);
        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);

        $this->actingAs($affiliateUser, 'sanctum')
            ->getJson('/api/v1/affiliates/payouts')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $other = $this->affiliateUser();
        $this->actingAs($other, 'sanctum')
            ->getJson('/api/v1/affiliates/payouts')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_super_admin_can_list_all_affiliates_with_stats(): void
    {
        $affiliateUser = $this->affiliateUser();
        LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'status' => 'disbursed']);
        LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'status' => 'new']);
        $this->accrueCommission($affiliateUser, 1000);

        $response = $this->actingAs($this->superAdmin(), 'sanctum')
            ->getJson('/api/v1/super-admin/affiliates');

        $response->assertOk()
            ->assertJsonPath('data.0.user.email', $affiliateUser->email)
            ->assertJsonPath('data.0.user.role', 'affiliate')
            // accrueCommission() creates its own lead too, so the total is
            // 3 (2 explicit + 1 from the helper), not 2.
            ->assertJsonPath('data.0.referral_count', 3)
            ->assertJsonPath('data.0.converted_count', 1)
            ->assertJsonPath('data.0.commission_accrued', 1000);
    }

    public function test_super_admin_can_manage_affiliate_commission_rate_and_status(): void
    {
        $affiliateUser = $this->affiliateUser();
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/super-admin/affiliates/{$affiliateUser->id}", [
            'commission_rate' => 3.25,
            'status' => 'suspended',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.commission_rate', 3.25)
            ->assertJsonPath('data.status', 'suspended');

        $this->assertFalse((bool) $affiliateUser->fresh()->is_active);
    }
}
