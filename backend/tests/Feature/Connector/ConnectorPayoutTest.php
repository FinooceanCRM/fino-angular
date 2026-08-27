<?php

namespace Tests\Feature\Connector;

use App\Enums\ConnectorCommissionStatus;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\ConnectorCommission;
use App\Models\ConnectorPayout;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\ConnectorCommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectorPayoutTest extends TestCase
{
    use RefreshDatabase;

    private int $referralCodeCounter = 0;

    private function connectorUser(array $attributes = []): User
    {
        $user = User::factory()->role(UserRole::Connector)->create($attributes);
        Connector::factory()->create([
            'user_id' => $user->id,
            'referral_code' => 'PO'.str_pad((string) ++$this->referralCodeCounter, 6, '0', STR_PAD_LEFT),
            'payout_method' => 'bank_transfer',
        ]);

        return $user;
    }

    private function superAdmin(): User
    {
        return User::factory()->role(UserRole::SuperAdmin)->create();
    }

    private function accrueCommission(User $connectorUser, float $amount): ConnectorCommission
    {
        // Pinned to 'new' (not the factory's random default) — see the same
        // note in AffiliatePayoutTest::accrueCommission() for why.
        $lead = LoanLead::factory()->create(['connector_id' => $connectorUser->id, 'status' => 'new']);

        return ConnectorCommission::query()->create([
            'connector_id' => $connectorUser->id,
            'loan_lead_id' => $lead->id,
            'level' => 0,
            'commission_rate' => 2.0,
            'commission_amount' => $amount,
            'status' => ConnectorCommissionStatus::Accrued->value,
            'accrued_at' => now(),
        ]);
    }

    public function test_connector_can_request_a_payout_summing_accrued_commissions(): void
    {
        $connectorUser = $this->connectorUser();
        $this->accrueCommission($connectorUser, 1000);
        $this->accrueCommission($connectorUser, 500);

        $response = $this->actingAs($connectorUser, 'sanctum')->postJson('/api/v1/connectors/payouts');

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', 1500)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.method', 'bank_transfer');

        $payout = ConnectorPayout::query()->where('connector_id', $connectorUser->id)->firstOrFail();
        $this->assertSame(2, ConnectorCommission::query()->where('payout_id', $payout->id)->count());
    }

    public function test_cannot_request_a_payout_with_zero_accrued_balance(): void
    {
        $connectorUser = $this->connectorUser();

        $this->actingAs($connectorUser, 'sanctum')
            ->postJson('/api/v1/connectors/payouts')
            ->assertStatus(422);

        $this->assertSame(0, ConnectorPayout::query()->count());
    }

    public function test_only_super_admin_can_approve_or_reject_a_payout(): void
    {
        $connectorUser = $this->connectorUser();
        $this->accrueCommission($connectorUser, 1000);
        $this->actingAs($connectorUser, 'sanctum')->postJson('/api/v1/connectors/payouts')->assertStatus(201);
        $payout = ConnectorPayout::query()->where('connector_id', $connectorUser->id)->firstOrFail();

        $this->actingAs($connectorUser, 'sanctum')
            ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/approve")
            ->assertStatus(403);

        $admin = $this->superAdmin();
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');
    }

    public function test_approving_flips_commission_rows_to_paid_then_mark_paid_finalises(): void
    {
        $connectorUser = $this->connectorUser();
        $this->accrueCommission($connectorUser, 1000);
        $this->actingAs($connectorUser, 'sanctum')->postJson('/api/v1/connectors/payouts')->assertStatus(201);
        $payout = ConnectorPayout::query()->where('connector_id', $connectorUser->id)->firstOrFail();

        $admin = $this->superAdmin();
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/approve")
            ->assertOk();

        $this->assertSame(
            1,
            ConnectorCommission::query()->where('payout_id', $payout->id)->where('status', 'paid')->count(),
        );

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/mark-paid")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
    }

    public function test_rejecting_reverts_commission_rows_to_accrued(): void
    {
        $connectorUser = $this->connectorUser();
        $this->accrueCommission($connectorUser, 1000);
        $this->actingAs($connectorUser, 'sanctum')->postJson('/api/v1/connectors/payouts')->assertStatus(201);
        $payout = ConnectorPayout::query()->where('connector_id', $connectorUser->id)->firstOrFail();

        $this->actingAs($this->superAdmin(), 'sanctum')
            ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/reject", ['reason' => 'Bad bank details.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'failed');

        $commission = ConnectorCommission::query()->where('connector_id', $connectorUser->id)->firstOrFail();
        $this->assertSame('accrued', $commission->status->value);
        $this->assertNull($commission->payout_id);
    }

    public function test_super_admin_can_manage_connector_commission_rate_and_status(): void
    {
        $connectorUser = $this->connectorUser();
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/super-admin/connectors/{$connectorUser->id}", [
            'commission_rate' => 3.25,
            'status' => 'suspended',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.commission_rate', 3.25)
            ->assertJsonPath('data.status', 'suspended');

        $this->assertFalse((bool) $connectorUser->fresh()->is_active);
    }

    /**
     * End-to-end: a full A -> B -> C referral chain, C's lead disburses
     * (accruing base + cascading override commissions in one shot via the
     * real accrual service, not the test's own hand-rolled helper), each
     * connector independently requests and gets paid their own payout.
     */
    public function test_full_chain_accrual_and_independent_payouts(): void
    {
        $a = $this->connectorUser();
        $b = $this->connectorUser();
        Connector::query()->where('user_id', $b->id)->update(['referred_by_connector_id' => $a->id]);
        $c = $this->connectorUser();
        Connector::query()->where('user_id', $c->id)->update(['referred_by_connector_id' => $b->id]);

        Connector::query()->whereIn('user_id', [$a->id, $b->id, $c->id])->update(['commission_rate' => 1.0]);
        config(['connectors.referral_override_rate' => 20.00]);

        $lead = LoanLead::factory()->create([
            'connector_id' => $c->id,
            'loan_amount' => 100000,
            'status' => LeadStatus::Disbursed->value,
        ]);

        app(ConnectorCommissionService::class)->accrueForLead($lead);

        $admin = $this->superAdmin();

        foreach ([$c->id => 1000, $b->id => 200, $a->id => 40] as $connectorId => $expectedAmount) {
            $connectorUser = User::query()->find($connectorId);

            $this->actingAs($connectorUser, 'sanctum')
                ->postJson('/api/v1/connectors/payouts')
                ->assertStatus(201)
                ->assertJsonPath('data.amount', $expectedAmount);

            $payout = ConnectorPayout::query()->where('connector_id', $connectorId)->firstOrFail();

            $this->actingAs($admin, 'sanctum')
                ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/approve")
                ->assertOk();

            $this->actingAs($admin, 'sanctum')
                ->postJson("/api/v1/super-admin/connectors/payouts/{$payout->id}/mark-paid")
                ->assertOk()
                ->assertJsonPath('data.status', 'paid');
        }

        $this->assertSame(3, ConnectorPayout::query()->where('status', 'paid')->count());
    }
}
