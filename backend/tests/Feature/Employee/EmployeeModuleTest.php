<?php

namespace Tests\Feature\Employee;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmployeeModuleTest extends TestCase
{
    use RefreshDatabase;

    private function employee(?User $relationshipManager = null): User
    {
        return User::factory()->create([
            'role' => UserRole::Employee,
            'is_active' => true,
            'relationship_manager_id' => $relationshipManager?->id,
            'manager_id' => $relationshipManager?->manager_id,
        ]);
    }

    public function test_employee_routes_are_registered(): void
    {
        foreach ([
            'api.v1.employees.dashboard',
            'api.v1.employees.profile.show',
            'api.v1.employees.profile.update',
            'api.v1.employees.team',
        ] as $name) {
            $this->assertNotNull(app('router')->getRoutes()->getByName($name), "Missing route {$name}");
        }
    }

    public function test_employee_can_load_dashboard_with_relationship_manager(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $manager->id,
        ]);
        $employee = $this->employee($rm);

        Sanctum::actingAs($employee);

        $this->getJson('/api/v1/employees/dashboard')
            ->assertOk()
            ->assertJsonPath('data.employee.email', $employee->email)
            ->assertJsonPath('data.relationship_manager.id', $rm->id)
            ->assertJsonPath('data.account_status.is_active', true)
            ->assertJsonStructure(['data' => ['welcome', 'quick_actions']]);
    }

    public function test_employee_can_read_and_update_own_profile(): void
    {
        $employee = $this->employee();
        Sanctum::actingAs($employee);

        $this->getJson('/api/v1/employees/profile')->assertOk();

        $this->putJson('/api/v1/employees/profile', [
            'name' => 'Updated Employee',
            'designation' => 'Senior Executive',
            'department' => 'Sales',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'pincode' => '411001',
        ])
            ->assertOk()
            ->assertJsonPath('data.designation', 'Senior Executive');

        $this->assertDatabaseHas('users', ['id' => $employee->id, 'name' => 'Updated Employee']);
        $this->assertDatabaseHas('employees', ['user_id' => $employee->id, 'city' => 'Pune']);
    }

    public function test_profile_update_rejects_invalid_pincode(): void
    {
        Sanctum::actingAs($this->employee());

        $this->putJson('/api/v1/employees/profile', ['pincode' => 'abc'])
            ->assertStatus(422);
    }

    public function test_team_returns_employee_and_reporting_relationship_manager(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $manager->id,
        ]);
        $employee = $this->employee($rm);

        Sanctum::actingAs($employee);

        $this->getJson('/api/v1/employees/team')
            ->assertOk()
            ->assertJsonPath('data.employee.id', $employee->id)
            ->assertJsonPath('data.relationship_manager.id', $rm->id)
            ->assertJsonPath('data.manager.id', $manager->id);
    }

    public function test_non_employee_roles_cannot_access_employee_routes(): void
    {
        foreach ([UserRole::SuperAdmin, UserRole::Manager, UserRole::RelationshipManager, UserRole::Connector] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));

            $this->getJson('/api/v1/employees/dashboard')->assertForbidden();
            $this->getJson('/api/v1/employees/team')->assertForbidden();
        }
    }

    public function test_employee_cannot_access_connector_routes(): void
    {
        Sanctum::actingAs($this->employee());

        $this->getJson('/api/v1/connectors/dashboard')->assertForbidden();
        $this->getJson('/api/v1/connectors/profile')->assertForbidden();
    }

    public function test_employee_cannot_create_or_edit_users(): void
    {
        $employee = $this->employee();
        $other = User::factory()->create(['role' => UserRole::Employee]);

        Sanctum::actingAs($employee);

        $this->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => 'new.user@finoocean.test',
            'password' => 'password123',
            'role' => UserRole::Employee->value,
        ])->assertForbidden();

        $this->putJson("/api/v1/users/{$other->id}", ['name' => 'Hacked'])->assertForbidden();
        $this->deleteJson("/api/v1/users/{$other->id}")->assertForbidden();
    }

    public function test_guest_cannot_access_employee_routes(): void
    {
        $this->getJson('/api/v1/employees/dashboard')->assertUnauthorized();
    }

    public function test_employee_profile_policy_scopes_reads(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager]);
        $employee = $this->employee($rm);
        $profile = Employee::factory()->create(['user_id' => $employee->id]);

        $this->assertTrue($rm->can('view', $profile));
        $this->assertTrue($employee->can('view', $profile));

        $stranger = User::factory()->create(['role' => UserRole::RelationshipManager]);
        $this->assertFalse($stranger->can('view', $profile));
    }
}
