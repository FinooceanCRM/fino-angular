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
