<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\UserHierarchyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserHierarchyServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserHierarchyService $hierarchy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hierarchy = app(UserHierarchyService::class);
    }

    public function test_super_admin_can_manage_everyone(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $employee = User::factory()->create(['role' => UserRole::Employee]);

        $this->assertTrue($this->hierarchy->canManage($admin, $employee));
    }

    public function test_manager_manages_only_own_subtree(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $other = User::factory()->create(['role' => UserRole::Manager]);

        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $manager->id,
        ]);
        $foreignRm = User::factory()->create([
            'role' => UserRole::RelationshipManager,
            'manager_id' => $other->id,
        ]);

        $this->assertTrue($this->hierarchy->canManage($manager, $rm));
        $this->assertFalse($this->hierarchy->canManage($manager, $foreignRm));
    }

    public function test_relationship_manager_manages_only_assigned_employees(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager]);
        $mine = User::factory()->create([
            'role' => UserRole::Employee,
            'relationship_manager_id' => $rm->id,
        ]);
        $theirs = User::factory()->create(['role' => UserRole::Employee]);

        $this->assertTrue($this->hierarchy->canManage($rm, $mine));
        $this->assertFalse($this->hierarchy->canManage($rm, $theirs));
    }

    public function test_employees_and_connectors_manage_nobody(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee]);
        $connector = User::factory()->create(['role' => UserRole::Connector]);
        $target = User::factory()->create(['role' => UserRole::Employee]);

        $this->assertFalse($this->hierarchy->canManage($employee, $target));
        $this->assertFalse($this->hierarchy->canManage($connector, $target));
        $this->assertSame([], $this->hierarchy->assignableRoles($connector));
    }
}
