<?php

namespace Tests\Feature\RelationshipManager;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RelationshipManagerModuleTest extends TestCase
{
    use RefreshDatabase;

    private function relationshipManager(): User
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);

        return User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $manager->id,
        ]);
    }

    public function test_routes_are_registered(): void
    {
        $routes = collect(app('router')->getRoutes())
            ->map(fn ($route): string => $route->methods()[0].' '.$route->uri())
            ->all();

        $this->assertContains('GET api/v1/relationship-managers/dashboard', $routes);
        $this->assertContains('GET api/v1/relationship-managers/profile', $routes);
        $this->assertContains('PUT api/v1/relationship-managers/profile', $routes);
        $this->assertContains('GET api/v1/relationship-managers/employees', $routes);
        $this->assertContains('GET api/v1/relationship-managers/connectors', $routes);
    }

    public function test_dashboard_returns_team_summary(): void
    {
        $rm = $this->relationshipManager();

        User::factory()->count(2)->create([
            'role' => UserRole::Employee,
            'relationship_manager_id' => $rm->id,
        ]);

        Connector::factory()->create(['relationship_manager_id' => $rm->id]);

        Sanctum::actingAs($rm);

        $response = $this->getJson('/api/v1/relationship-managers/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.team_summary.employee_count', 2)
            ->assertJsonPath('data.team_summary.connector_count', 1)
            ->assertJsonPath('data.account_status.is_active', true);
    }

    public function test_profile_can_be_read_and_updated(): void
    {
        $rm = $this->relationshipManager();
        Sanctum::actingAs($rm);

        $this->getJson('/api/v1/relationship-managers/profile')->assertOk();

        $this->putJson('/api/v1/relationship-managers/profile', [
            'name' => 'Updated RM',
            'branch' => 'Andheri Branch',
            'region' => 'West',
        ])
            ->assertOk()
            ->assertJsonPath('data.branch', 'Andheri Branch')
            ->assertJsonPath('data.user.name', 'Updated RM');
    }

    public function test_employees_list_only_contains_assigned_employees(): void
    {
        $rm = $this->relationshipManager();

        $mine = User::factory()->create([
            'role' => UserRole::Employee,
            'relationship_manager_id' => $rm->id,
        ]);
        Employee::factory()->create(['user_id' => $mine->id]);

        User::factory()->create(['role' => UserRole::Employee]);

        Sanctum::actingAs($rm);

        $response = $this->getJson('/api/v1/relationship-managers/employees');

        $response->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.employees.0.id', $mine->id);
    }

    public function test_connectors_list_only_contains_assigned_connectors(): void
    {
        $rm = $this->relationshipManager();

        $assigned = Connector::factory()->create(['relationship_manager_id' => $rm->id]);
        Connector::factory()->create(['relationship_manager_id' => null]);

        Sanctum::actingAs($rm);

        $this->getJson('/api/v1/relationship-managers/connectors')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.connectors.0.id', $assigned->id);
    }

    public function test_other_roles_cannot_reach_the_module(): void
    {
        foreach ([UserRole::SuperAdmin, UserRole::Manager, UserRole::Employee, UserRole::Connector] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));

            $this->getJson('/api/v1/relationship-managers/dashboard')->assertForbidden();
            $this->getJson('/api/v1/relationship-managers/employees')->assertForbidden();
            $this->getJson('/api/v1/relationship-managers/connectors')->assertForbidden();
        }
    }

    public function test_relationship_manager_cannot_create_users(): void
    {
        Sanctum::actingAs($this->relationshipManager());

        $this->postJson('/api/v1/users', [
            'name' => 'New Manager',
            'email' => 'newmanager@finoocean.test',
            'password' => 'password123',
            'role' => UserRole::Manager->value,
        ])->assertForbidden();
    }
}
