<?php

namespace Tests\Feature\Connector;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ConnectorModuleTest extends TestCase
{
    use RefreshDatabase;

    private function connector(array $attributes = []): User
    {
        return User::factory()->role(UserRole::Connector)->create($attributes);
    }

    public function test_connector_routes_are_registered(): void
    {
        $names = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->values()
            ->all();

        foreach ([
            'api.v1.connectors.dashboard',
            'api.v1.connectors.profile.show',
            'api.v1.connectors.profile.update',
            'api.v1.connectors.network',
            'api.v1.connectors.commissions',
            'api.v1.connectors.payouts.store',
            'api.v1.connectors.payouts.index',
        ] as $name) {
            $this->assertContains($name, $names);
        }
    }

    public function test_connector_can_load_dashboard(): void
    {
        $user = $this->connector(['name' => 'Connector One']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/connectors/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.role.value', 'connector')
            ->assertJsonPath('data.role.independent', true)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.account_status.is_active', true)
            ->assertJsonStructure([
                'data' => ['welcome' => ['headline', 'message'], 'user', 'role', 'account_status'],
            ]);
    }

    public function test_profile_is_auto_provisioned_on_first_read(): void
    {
        $user = $this->connector();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/connectors/profile')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->assertDatabaseHas('connectors', ['user_id' => $user->id]);
    }

    public function test_connector_can_update_own_profile(): void
    {
        $user = $this->connector();
        Connector::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/connectors/profile', [
            'name' => 'Updated Connector',
            'company_name' => 'Updated Partners',
            'city' => 'Nagpur',
            'pincode' => '440001',
            'pan_number' => 'abcde1234f',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.company_name', 'Updated Partners')
            ->assertJsonPath('data.pan_number', 'ABCDE1234F')
            ->assertJsonPath('data.user.name', 'Updated Connector');

        $this->assertDatabaseHas('connectors', ['user_id' => $user->id, 'city' => 'Nagpur']);
    }

    public function test_profile_update_validates_input(): void
    {
        $user = $this->connector();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/connectors/profile', ['pincode' => 'abc', 'pan_number' => '123'])
            ->assertStatus(422);
    }

    public function test_connector_dashboard_includes_referral_info(): void
    {
        $user = $this->connector();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/connectors/dashboard');

        $response->assertOk()->assertJsonStructure([
            'data' => [
                'referral' => ['code', 'link', 'direct_referrals'],
                'network_totals' => [
                    'referral_count', 'converted_count',
                    'commission_accrued', 'commission_paid', 'pending_payout',
                ],
            ],
        ]);

        $this->assertDatabaseHas('connectors', ['user_id' => $user->id, 'status' => 'active']);
        $code = \App\Models\Connector::query()->where('user_id', $user->id)->value('referral_code');
        $this->assertNotEmpty($code);
    }

    public function test_network_only_shows_direct_referrals(): void
    {
        $inviter = $this->connector();
        Connector::factory()->create(['user_id' => $inviter->id, 'referral_code' => 'NET00001']);

        $child = $this->connector();
        Connector::factory()->create([
            'user_id' => $child->id,
            'referral_code' => 'NET00002',
            'referred_by_connector_id' => $inviter->id,
        ]);

        // Grandchild — must NOT show up in the inviter's direct network.
        $grandchild = $this->connector();
        Connector::factory()->create([
            'user_id' => $grandchild->id,
            'referral_code' => 'NET00003',
            'referred_by_connector_id' => $child->id,
        ]);

        $this->actingAs($inviter, 'sanctum')
            ->getJson('/api/v1/connectors/network')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.id', $child->id);
    }

    public function test_non_connector_roles_are_forbidden(): void
    {
        foreach ([UserRole::SuperAdmin, UserRole::Manager, UserRole::RelationshipManager, UserRole::Employee] as $role) {
            $user = User::factory()->role($role)->create();

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/connectors/dashboard')
                ->assertStatus(403);
        }
    }

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/v1/connectors/dashboard')->assertStatus(401);
    }
}
