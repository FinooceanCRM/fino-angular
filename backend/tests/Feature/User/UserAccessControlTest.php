<?php

namespace Tests\Feature\User;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_cannot_list_users(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Employee]));

        $this->getJson('/api/v1/users')->assertStatus(403);
    }

    public function test_user_management_routes_are_registered(): void
    {
        $this->assertSame('api.v1.users.index', app('router')->getRoutes()->match(
            \Illuminate\Http\Request::create('/api/v1/users', 'GET'),
        )->getName());
        $this->assertSame('api.v1.users.show', app('router')->getRoutes()->match(
            \Illuminate\Http\Request::create('/api/v1/users/1', 'GET'),
        )->getName());
        $this->assertSame('api.v1.users.store', app('router')->getRoutes()->match(
            \Illuminate\Http\Request::create('/api/v1/users', 'POST'),
        )->getName());
        $this->assertSame('api.v1.users.update', app('router')->getRoutes()->match(
            \Illuminate\Http\Request::create('/api/v1/users/1', 'PUT'),
        )->getName());
        $this->assertSame('api.v1.users.destroy', app('router')->getRoutes()->match(
            \Illuminate\Http\Request::create('/api/v1/users/1', 'DELETE'),
        )->getName());
    }

    public function test_super_admin_lists_all_users(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::SuperAdmin]));
        User::factory()->count(3)->create(['role' => UserRole::Employee]);

        $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_manager_only_sees_own_subtree(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $manager->id,
        ]);
        $foreign = User::factory()->create(['role' => UserRole::RelationshipManager]);

        Sanctum::actingAs($manager);

        $response = $this->getJson('/api/v1/users')->assertOk();
        $ids = array_column($response->json('data'), 'id');

        $this->assertContains($rm->id, $ids);
        $this->assertNotContains($foreign->id, $ids);
    }

    public function test_manager_cannot_view_user_outside_hierarchy(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $foreign = User::factory()->create(['role' => UserRole::Employee]);

        Sanctum::actingAs($manager);

        $this->getJson("/api/v1/users/{$foreign->id}")->assertStatus(403);
    }

    public function test_manager_creating_rm_is_auto_assigned(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/users', [
            'name' => 'New RM',
            'email' => 'new.rm@finoocean.test',
            'password' => 'password123',
            'role' => UserRole::RelationshipManager->value,
        ])
            ->assertCreated()
            ->assertJsonPath('data.manager_id', $manager->id);
    }

    public function test_manager_cannot_create_a_manager(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Manager]));

        $this->postJson('/api/v1/users', [
            'name' => 'Rogue Manager',
            'email' => 'rogue@finoocean.test',
            'password' => 'password123',
            'role' => UserRole::Manager->value,
        ])->assertStatus(403);
    }

    public function test_only_super_admin_can_delete(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($manager);
        $this->deleteJson("/api/v1/users/{$employee->id}")->assertStatus(403);

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::SuperAdmin]));
        $this->deleteJson("/api/v1/users/{$employee->id}")->assertOk();
    }

    public function test_connector_has_no_user_management_access(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Connector]));

        $this->getJson('/api/v1/users')->assertStatus(403);
    }

    public function test_manager_cannot_assign_employee_to_foreign_relationship_manager(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $otherManager = User::factory()->create(['role' => UserRole::Manager]);
        $foreignRm = User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $otherManager->id,
        ]);
        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/users', [
            'name' => 'Foreign Employee',
            'email' => 'foreign.employee@finoocean.test',
            'password' => 'password123',
            'role' => UserRole::Employee->value,
            'relationship_manager_id' => $foreignRm->id,
        ])->assertStatus(422);
    }
}
