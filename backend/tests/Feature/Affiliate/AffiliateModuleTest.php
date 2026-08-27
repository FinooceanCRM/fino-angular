<?php

namespace Tests\Feature\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AffiliateModuleTest extends TestCase
{
    use RefreshDatabase;

    private function affiliateUser(array $attributes = []): User
    {
        $user = User::factory()->role(UserRole::Affiliate)->create($attributes);
        Affiliate::factory()->active()->create(['user_id' => $user->id]);

        return $user;
    }

    public function test_affiliate_routes_are_registered(): void
    {
        $names = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->values()
            ->all();

        foreach ([
            'api.v1.affiliates.dashboard',
            'api.v1.affiliates.profile.show',
            'api.v1.affiliates.profile.update',
            'api.v1.affiliates.referrals',
            'api.v1.affiliates.commissions',
        ] as $name) {
            $this->assertContains($name, $names);
        }
    }

    public function test_affiliate_can_load_dashboard(): void
    {
        $user = $this->affiliateUser(['name' => 'Affiliate One']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/affiliates/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.account_status.is_active', true)
            ->assertJsonStructure([
                'data' => [
                    'welcome' => ['headline', 'message'],
                    'user',
                    'referral' => ['code', 'link'],
                    'totals' => [
                        'referral_count', 'converted_count',
                        'commission_accrued', 'commission_paid', 'pending_payout',
                    ],
                    'account_status',
                ],
            ]);
    }

    public function test_affiliate_can_view_own_profile(): void
    {
        $user = $this->affiliateUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/affiliates/profile')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_profile_requires_an_existing_affiliate_row(): void
    {
        $user = User::factory()->role(UserRole::Affiliate)->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/affiliates/profile')
            ->assertStatus(404);
    }

    public function test_affiliate_can_update_payout_details_but_not_sensitive_fields(): void
    {
        $user = $this->affiliateUser();
        $affiliate = Affiliate::query()->where('user_id', $user->id)->firstOrFail();
        $originalReferralCode = $affiliate->referral_code;
        $originalCommissionRate = $affiliate->commission_rate;

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/affiliates/profile', [
            'alternate_phone' => '9999999999',
            'payout_method' => 'upi',
            'payout_account_name' => 'Updated Name',
            'payout_ifsc_or_upi' => 'updated@upi',
            // Attempted sensitive-field overrides — must be silently ignored.
            'referral_code' => 'HACKED01',
            'commission_rate' => 99.99,
            'email' => 'hacker@example.test',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.alternate_phone', '9999999999')
            ->assertJsonPath('data.payout_method', 'upi');

        $affiliate->refresh();
        $this->assertSame($originalReferralCode, $affiliate->referral_code);
        $this->assertEquals($originalCommissionRate, $affiliate->commission_rate);

        $user->refresh();
        $this->assertNotSame('hacker@example.test', $user->email);
    }

    public function test_profile_update_validates_input(): void
    {
        $user = $this->affiliateUser();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/affiliates/profile', ['payout_method' => 'not-a-method'])
            ->assertStatus(422);
    }

    public function test_affiliate_can_view_own_referrals(): void
    {
        $user = $this->affiliateUser();
        $other = $this->affiliateUser();

        LoanLead::factory()->count(2)->create(['affiliate_id' => $user->id, 'status' => LeadStatus::New->value]);
        LoanLead::factory()->create(['affiliate_id' => $user->id, 'status' => LeadStatus::Disbursed->value]);
        LoanLead::factory()->create(['affiliate_id' => $other->id, 'status' => LeadStatus::New->value]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/affiliates/referrals')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_affiliate_can_view_own_commissions(): void
    {
        $user = $this->affiliateUser();
        $lead = LoanLead::factory()->create(['affiliate_id' => $user->id, 'status' => LeadStatus::Disbursed->value]);

        AffiliateCommission::query()->create([
            'affiliate_id' => $user->id,
            'loan_lead_id' => $lead->id,
            'commission_rate' => 2.5,
            'commission_amount' => 500,
            'status' => AffiliateCommissionStatus::Accrued->value,
            'accrued_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/affiliates/commissions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.commission_amount', 500)
            ->assertJsonPath('data.0.status', 'accrued');
    }

    public function test_non_affiliate_roles_are_forbidden(): void
    {
        foreach ([
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
            UserRole::Employee,
            UserRole::Connector,
            UserRole::Banker,
            UserRole::Telecaller,
        ] as $role) {
            $user = User::factory()->role($role)->create();

            foreach (['dashboard', 'profile', 'referrals', 'commissions'] as $action) {
                $this->actingAs($user, 'sanctum')
                    ->getJson("/api/v1/affiliates/{$action}")
                    ->assertStatus(403);
            }
        }
    }

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/v1/affiliates/dashboard')->assertStatus(401);
    }
}
