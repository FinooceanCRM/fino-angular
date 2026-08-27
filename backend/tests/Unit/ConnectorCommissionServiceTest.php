<?php

namespace Tests\Unit;

use App\Enums\ConnectorCommissionStatus;
use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\ConnectorCommission;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\ConnectorCommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectorCommissionServiceTest extends TestCase
{
    use RefreshDatabase;

    private int $referralCodeCounter = 0;

    private function service(): ConnectorCommissionService
    {
        return app(ConnectorCommissionService::class);
    }

    private function connectorUser(?float $commissionRate = null, ?User $referredBy = null): User
    {
        $user = User::factory()->role(UserRole::Connector)->create();
        Connector::factory()->create([
            'user_id' => $user->id,
            'referral_code' => 'CODE'.str_pad((string) ++$this->referralCodeCounter, 4, '0', STR_PAD_LEFT),
            'referred_by_connector_id' => $referredBy?->id,
            'commission_rate' => $commissionRate,
        ]);

        return $user;
    }

    public function test_accrues_a_level_zero_commission_using_the_connectors_own_rate(): void
    {
        $connectorUser = $this->connectorUser(2.5);
        $lead = LoanLead::factory()->create(['connector_id' => $connectorUser->id, 'loan_amount' => 100000]);

        $rows = $this->service()->accrueForLead($lead);

        $this->assertCount(1, $rows);
        $this->assertSame(0, $rows[0]->level);
        $this->assertNull($rows[0]->source_connector_id);
        $this->assertSame(2500.0, (float) $rows[0]->commission_amount);
        $this->assertSame(2.5, (float) $rows[0]->commission_rate);
        $this->assertSame(ConnectorCommissionStatus::Accrued, $rows[0]->status);
    }

    public function test_falls_back_to_the_global_default_rate_when_connector_rate_is_null(): void
    {
        config(['connectors.default_commission_rate' => 1.5]);

        $connectorUser = $this->connectorUser(null);
        $lead = LoanLead::factory()->create(['connector_id' => $connectorUser->id, 'loan_amount' => 200000]);

        $rows = $this->service()->accrueForLead($lead);

        $this->assertSame(3000.0, (float) $rows[0]->commission_amount);
        $this->assertSame(1.5, (float) $rows[0]->commission_rate);
    }

    public function test_is_a_noop_when_the_lead_has_no_connector(): void
    {
        $lead = LoanLead::factory()->create(['connector_id' => null]);

        $rows = $this->service()->accrueForLead($lead);

        $this->assertSame([], $rows);
        $this->assertSame(0, ConnectorCommission::query()->count());
    }

    public function test_is_idempotent_for_the_same_lead(): void
    {
        $connectorUser = $this->connectorUser(2.0);
        $lead = LoanLead::factory()->create(['connector_id' => $connectorUser->id, 'loan_amount' => 100000]);

        $first = $this->service()->accrueForLead($lead);
        $second = $this->service()->accrueForLead($lead);

        $this->assertNotEmpty($first);
        $this->assertSame([], $second);
        $this->assertSame(
            count($first),
            ConnectorCommission::query()->where('loan_lead_id', $lead->id)->count(),
        );
    }

    public function test_a_root_connector_with_no_inviter_produces_only_a_level_zero_row(): void
    {
        $root = $this->connectorUser(2.0);
        $lead = LoanLead::factory()->create(['connector_id' => $root->id, 'loan_amount' => 100000]);

        $rows = $this->service()->accrueForLead($lead);

        $this->assertCount(1, $rows);
    }

    /**
     * A -> B -> C referral chain (A is C's grandparent, B is C's direct
     * inviter). C earns 1000 on their own disbursed lead; per the locked
     * business rule, B's override is 20% of C's amount, and A's override is
     * 20% of B's override (not 20% of C's original amount).
     */
    public function test_cascades_overrides_up_a_three_level_chain_with_geometric_decay(): void
    {
        config(['connectors.referral_override_rate' => 20.00]);

        $a = $this->connectorUser(commissionRate: 1.0);
        $b = $this->connectorUser(commissionRate: 1.0, referredBy: $a);
        $c = $this->connectorUser(commissionRate: 1.0, referredBy: $b);

        // 1.0% of 100000 = 1000, matching the worked example (C earns 1000).
        $lead = LoanLead::factory()->create(['connector_id' => $c->id, 'loan_amount' => 100000]);

        $rows = $this->service()->accrueForLead($lead);

        $this->assertCount(3, $rows);

        $byLevel = collect($rows)->keyBy('level');

        $this->assertSame(1000.0, (float) $byLevel[0]->commission_amount);
        $this->assertSame($c->id, $byLevel[0]->connector_id);
        $this->assertNull($byLevel[0]->source_connector_id);

        $this->assertSame(200.0, (float) $byLevel[1]->commission_amount); // 20% of 1000
        $this->assertSame($b->id, $byLevel[1]->connector_id);
        $this->assertSame($c->id, $byLevel[1]->source_connector_id);

        $this->assertSame(40.0, (float) $byLevel[2]->commission_amount); // 20% of 200
        $this->assertSame($a->id, $byLevel[2]->connector_id);
        $this->assertSame($b->id, $byLevel[2]->source_connector_id);

        $this->assertSame(3, ConnectorCommission::query()->where('loan_lead_id', $lead->id)->count());
    }
}
