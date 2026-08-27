<?php

namespace Tests\Feature\Manager;

use App\Enums\Department;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagerModuleTest extends TestCase
{
    use RefreshDatabase;

    private function manager(): User
    {
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);

        return User::factory()->create([
            'role' => UserRole::Manager,
            'manager_id' => $superAdmin->id,
        ]);
    }

    private function relationshipManagerUnder(User $manager): User
    {
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

        $this->assertContains('GET api/v1/managers/dashboard', $routes);
        $this->assertContains('GET api/v1/managers/profile', $routes);
        $this->assertContains('PUT api/v1/managers/profile', $routes);
        $this->assertContains('GET api/v1/managers/relationship-managers', $routes);
        $this->assertContains('POST api/v1/managers/relationship-managers', $routes);
        $this->assertContains('PUT api/v1/managers/relationship-managers/{relationship_manager}', $routes);
        $this->assertContains('GET api/v1/managers/employees', $routes);
        $this->assertContains('PUT api/v1/managers/employees/{employee}/reassign', $routes);
    }

    public function test_dashboard_returns_team_summary_and_hierarchy(): void
    {
        $manager = $this->manager();
        $rm = $this->relationshipManagerUnder($manager);

        User::factory()->count(2)->create([
            'role' => UserRole::Employee,
            'manager_id' => $manager->id,
            'relationship_manager_id' => $rm->id,
        ]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/managers/dashboard')
            ->assertOk()
            ->assertJsonPath('data.team_summary.relationship_manager_count', 1)
            ->assertJsonPath('data.team_summary.employee_count', 2)
            ->assertJsonPath('data.hierarchy.0.id', $rm->id)
            ->assertJsonCount(2, 'data.hierarchy.0.employees');
    }

    public function test_profile_can_be_read_and_updated(): void
    {
        Sanctum::actingAs($this->manager());

        $this->getJson('/api/v1/managers/profile')->assertOk();

        $this->putJson('/api/v1/managers/profile', [
            'name' => 'Updated Manager',
            'branch' => 'Head Office',
            'region' => 'West',
        ])
            ->assertOk()
            ->assertJsonPath('data.branch', 'Head Office')
            ->assertJsonPath('data.user.name', 'Updated Manager');
    }

    public function test_relationship_manager_list_is_scoped_to_the_manager(): void
    {
        $manager = $this->manager();
        $mine = $this->relationshipManagerUnder($manager);

        $otherManager = $this->manager();
        $this->relationshipManagerUnder($otherManager);

        Sanctum::actingAs($manager);

        $response = $this->getJson('/api/v1/managers/relationship-managers')->assertOk();

        $response->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.relationship_managers.0.id', $mine->id);
    }

    public function test_manager_can_create_a_relationship_manager_under_themselves(): void
    {
        $manager = $this->manager();
        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/managers/relationship-managers', [
            'name' => 'New RM',
            'email' => 'new-rm@finoocean.test',
            'password' => 'password123',
            'designation' => 'Relationship Manager',
            'department' => Department::PersonalLoan->value,
        ])
            ->assertCreated()
            ->assertJsonPath('data.role', UserRole::RelationshipManager->value)
            ->assertJsonPath('data.manager_id', $manager->id);

        $this->assertDatabaseHas('users', [
            'email' => 'new-rm@finoocean.test',
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);
    }

    public function test_manager_can_deactivate_their_own_relationship_manager(): void
    {
        $manager = $this->manager();
        $rm = $this->relationshipManagerUnder($manager);

        Sanctum::actingAs($manager);

        $this->putJson("/api/v1/managers/relationship-managers/{$rm->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_manager_cannot_edit_another_managers_relationship_manager(): void
    {
        $manager = $this->manager();
        $otherRm = $this->relationshipManagerUnder($this->manager());

        Sanctum::actingAs($manager);

        $this->putJson("/api/v1/managers/relationship-managers/{$otherRm->id}", ['is_active' => false])
            ->assertForbidden();
    }

    public function test_employee_list_only_contains_employees_under_own_relationship_managers(): void
    {
        $manager = $this->manager();
        $rm = $this->relationshipManagerUnder($manager);

        $mine = User::factory()->create([
            'role' => UserRole::Employee,
            'manager_id' => $manager->id,
            'relationship_manager_id' => $rm->id,
        ]);

        $otherManager = $this->manager();
        $otherRm = $this->relationshipManagerUnder($otherManager);
        User::factory()->create([
            'role' => UserRole::Employee,
            'manager_id' => $otherManager->id,
            'relationship_manager_id' => $otherRm->id,
        ]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/managers/employees')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.employees.0.id', $mine->id)
            ->assertJsonPath('data.employees.0.relationship_manager.id', $rm->id);
    }

    public function test_manager_can_reassign_an_employee_to_another_of_their_relationship_managers(): void
    {
        $manager = $this->manager();
        $originalRm = $this->relationshipManagerUnder($manager);
        $newRm = $this->relationshipManagerUnder($manager);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'manager_id' => $manager->id,
            'relationship_manager_id' => $originalRm->id,
        ]);

        Sanctum::actingAs($manager);

        $this->putJson("/api/v1/managers/employees/{$employee->id}/reassign", [
            'relationship_manager_id' => $newRm->id,
            'remarks' => 'Rebalancing workload.',
        ])
            ->assertOk()
            ->assertJsonPath('data.relationship_manager_id', $newRm->id);

        $this->assertDatabaseHas('users', [
            'id' => $employee->id,
            'relationship_manager_id' => $newRm->id,
        ]);
    }

    public function test_manager_cannot_reassign_an_employee_to_a_relationship_manager_outside_their_team(): void
    {
        $manager = $this->manager();
        $rm = $this->relationshipManagerUnder($manager);
        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'manager_id' => $manager->id,
            'relationship_manager_id' => $rm->id,
        ]);

        $otherManager = $this->manager();
        $foreignRm = $this->relationshipManagerUnder($otherManager);

        Sanctum::actingAs($manager);

        $this->putJson("/api/v1/managers/employees/{$employee->id}/reassign", [
            'relationship_manager_id' => $foreignRm->id,
        ])->assertStatus(422);

        $this->assertDatabaseHas('users', [
            'id' => $employee->id,
            'relationship_manager_id' => $rm->id,
        ]);
    }

    public function test_manager_cannot_reassign_another_managers_employee(): void
    {
        $manager = $this->manager();
        $rm = $this->relationshipManagerUnder($manager);

        $otherManager = $this->manager();
        $otherRm = $this->relationshipManagerUnder($otherManager);
        $otherEmployee = User::factory()->create([
            'role' => UserRole::Employee,
            'manager_id' => $otherManager->id,
            'relationship_manager_id' => $otherRm->id,
        ]);

        Sanctum::actingAs($manager);

        $this->putJson("/api/v1/managers/employees/{$otherEmployee->id}/reassign", [
            'relationship_manager_id' => $rm->id,
        ])->assertStatus(403);
    }

    public function test_other_roles_cannot_reach_manager_routes(): void
    {
        $manager = $this->manager();
        $rm = $this->relationshipManagerUnder($manager);

        Sanctum::actingAs($rm);
        $this->getJson('/api/v1/managers/dashboard')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Employee]));
        $this->getJson('/api/v1/managers/relationship-managers')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Connector]));
        $this->getJson('/api/v1/managers/employees')->assertForbidden();
    }
}
