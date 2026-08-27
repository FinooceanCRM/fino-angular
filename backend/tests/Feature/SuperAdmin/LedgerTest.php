<?php

namespace Tests\Feature\SuperAdmin;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\Connector;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\LedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LedgerTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->role(UserRole::SuperAdmin)->create();
    }

    private function hierarchy(): array
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);

        return compact('manager', 'rm');
    }

    public function test_disbursing_a_lead_writes_disbursement_and_commission_accrual_ledger_entries(): void
    {
        ['rm' => $rm] = $this->hierarchy();

        $connectorUser = User::factory()->role(UserRole::Connector)->create();
        Connector::factory()->create(['user_id' => $connectorUser->id]);

        $affiliateUser = User::factory()->role(UserRole::Affiliate)->create();
        Affiliate::factory()->active()->create(['user_id' => $affiliateUser->id]);

        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::UnderReview->value,
            'assigned_relationship_manager_id' => $rm->id,
            'connector_id' => $connectorUser->id,
            'affiliate_id' => $affiliateUser->id,
            'loan_amount' => 500000,
        ]);

        $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/status", ['status' => LeadStatus::Disbursed->value])
            ->assertOk();

        $this->assertDatabaseHas('ledger_entries', [
            'type' => 'disbursement',
            'related_type' => LoanLead::class,
            'related_id' => $lead->id,
            'debit' => 500000,
        ]);

        $this->assertDatabaseHas('ledger_entries', [
            'type' => 'connector_commission_accrued',
        ]);

        $this->assertDatabaseHas('ledger_entries', [
            'type' => 'affiliate_commission_accrued',
        ]);

        // Exactly one row per event: the disbursement itself, the
        // connector's level-0 accrual (no referral chain, so no cascade
        // override rows), and the affiliate's accrual.
        $this->assertSame(3, \App\Models\LedgerEntry::query()->count());
    }

    public function test_marking_an_affiliate_payout_paid_writes_a_ledger_entry(): void
    {
        $affiliateUser = User::factory()->role(UserRole::Affiliate)->create();
        Affiliate::factory()->active()->create(['user_id' => $affiliateUser->id, 'payout_method' => 'bank_transfer']);

        $lead = LoanLead::factory()->create(['affiliate_id' => $affiliateUser->id, 'status' => 'new']);
        AffiliateCommission::query()->create([
            'affiliate_id' => $affiliateUser->id,
            'loan_lead_id' => $lead->id,
            'commission_rate' => 2.0,
            'commission_amount' => 1000,
            'status' => AffiliateCommissionStatus::Accrued->value,
            'accrued_at' => now(),
        ]);

        $this->actingAs($affiliateUser, 'sanctum')->postJson('/api/v1/affiliates/payouts')->assertStatus(201);
        $payout = AffiliatePayout::query()->where('affiliate_id', $affiliateUser->id)->firstOrFail();

        $admin = $this->superAdmin();
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/approve")
            ->assertOk();

        // approve() alone must not yet write the "paid" ledger entry — only
        // markPaid() finalises the payout itself.
        $this->assertDatabaseMissing('ledger_entries', ['type' => 'affiliate_commission_paid']);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/super-admin/affiliates/payouts/{$payout->id}/mark-paid")
            ->assertOk();

        $this->assertDatabaseHas('ledger_entries', [
            'type' => 'affiliate_commission_paid',
            'related_type' => AffiliatePayout::class,
            'related_id' => $payout->id,
            'debit' => 1000,
        ]);
    }

    public function test_only_super_admin_can_view_the_ledger(): void
    {
        foreach ([UserRole::Manager, UserRole::RelationshipManager, UserRole::Employee, UserRole::Connector] as $role) {
            $user = User::factory()->role($role)->create();
            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/super-admin/ledger')
                ->assertStatus(403);
        }

        $this->actingAs($this->superAdmin(), 'sanctum')
            ->getJson('/api/v1/super-admin/ledger')
            ->assertOk();
    }

    public function test_ledger_index_computes_a_running_balance_newest_first_and_supports_filters(): void
    {
        /** @var LedgerService $ledger */
        $ledger = app(LedgerService::class);

        // Chronological order: disbursement (no balance move), then an
        // accrual (+500), then a payout (-500) — net balance ends at 0, but
        // the balance recorded on the accrual row itself must be 500.
        $this->travelTo(now()->subDays(2));
        $ledger->record('disbursement', 'Disbursement — LD-TEST (Test Applicant)', 100000, null);
        $this->travelTo(now()->addDay());
        $ledger->record('connector_commission_accrued', 'Commission accrued — Test Connector', null, 500);
        $this->travelTo(now()->addDay());
        $ledger->record('connector_commission_paid', 'Payout PO-TEST — Test Connector', 500, null);
        $this->travelBack();

        $admin = $this->superAdmin();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/super-admin/ledger');

        $response->assertOk()->assertJsonCount(3, 'data');

        // Newest first: the payout (paid) entry is first, disbursement last.
        $response->assertJsonPath('data.0.type', 'connector_commission_paid');
        $response->assertJsonPath('data.0.balance', 0);
        $response->assertJsonPath('data.1.type', 'connector_commission_accrued');
        $response->assertJsonPath('data.1.balance', 500);
        $response->assertJsonPath('data.2.type', 'disbursement');
        $response->assertJsonPath('data.2.balance', 0);

        $typeFiltered = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/super-admin/ledger?type=connector_commission_accrued');
        $typeFiltered->assertOk()->assertJsonCount(1, 'data');

        $searched = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/super-admin/ledger?search=PO-TEST');
        $searched->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'connector_commission_paid');
    }
}
