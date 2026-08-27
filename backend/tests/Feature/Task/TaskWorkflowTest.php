<?php

namespace Tests\Feature\Task;

use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_any_authenticated_role_can_create_a_task_defaulting_assignee_to_self(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);

        $response = $this->actingAs($employee, 'sanctum')->postJson('/api/v1/tasks', [
            'type' => 'call',
            'title' => 'Call Rohan Kulkarni re: income proof',
            'priority' => 'high',
            'due_at' => now()->addDay()->toIso8601String(),
        ]);

        $response->assertCreated();
        $this->assertSame('pending', $response->json('data.status'));
        $this->assertSame($employee->id, $response->json('data.created_by.id'));
        $this->assertSame($employee->id, $response->json('data.assigned_to.id'));
        $this->assertSame('General', $response->json('data.related_to'));

        $this->assertDatabaseHas('tasks', [
            'title' => 'Call Rohan Kulkarni re: income proof',
            'created_by' => $employee->id,
            'assigned_to' => $employee->id,
            'status' => 'pending',
        ]);
    }

    public function test_a_user_sees_a_task_they_are_assigned_but_not_an_unrelated_users_task(): void
    {
        $employeeA = User::factory()->create(['role' => UserRole::Employee->value]);
        $employeeB = User::factory()->create(['role' => UserRole::Employee->value]);

        $assignedTask = Task::factory()->create(['created_by' => $employeeB->id, 'assigned_to' => $employeeA->id]);
        $unrelatedTask = Task::factory()->create(['created_by' => $employeeB->id, 'assigned_to' => $employeeB->id]);

        $list = $this->actingAs($employeeA, 'sanctum')->getJson('/api/v1/tasks');
        $list->assertOk();
        $ids = collect($list->json('data'))->pluck('id')->all();
        $this->assertContains($assignedTask->id, $ids);
        $this->assertNotContains($unrelatedTask->id, $ids);

        $this->actingAs($employeeA, 'sanctum')
            ->getJson("/api/v1/tasks/{$unrelatedTask->id}")
            ->assertNotFound();
    }

    public function test_a_manager_sees_a_task_assigned_to_their_relationship_manager(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);
        $unrelated = User::factory()->create(['role' => UserRole::Employee->value]);

        $task = Task::factory()->create(['created_by' => $rm->id, 'assigned_to' => $rm->id]);

        $this->actingAs($manager, 'sanctum')
            ->getJson("/api/v1/tasks/{$task->id}")
            ->assertOk();

        $this->actingAs($unrelated, 'sanctum')
            ->getJson("/api/v1/tasks/{$task->id}")
            ->assertNotFound();
    }

    public function test_complete_cancel_and_reschedule_workflow(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $task = Task::factory()->create([
            'created_by' => $employee->id,
            'assigned_to' => $employee->id,
            'status' => 'pending',
        ]);

        $complete = $this->actingAs($employee, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/complete");
        $complete->assertOk();
        $this->assertSame('completed', $complete->json('data.status'));
        $this->assertNotNull($complete->json('data.completed_at'));

        $newDueAt = now()->addWeek()->toIso8601String();
        $reschedule = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/tasks/{$task->id}/reschedule", ['due_at' => $newDueAt]);
        $reschedule->assertOk();
        // Rescheduling forces status back to pending, matching the mock's exact behaviour.
        $this->assertSame('pending', $reschedule->json('data.status'));

        $cancel = $this->actingAs($employee, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/cancel");
        $cancel->assertOk();
        $this->assertSame('cancelled', $cancel->json('data.status'));
    }

    public function test_assigned_to_team_filter_backs_the_rm_activities_consolidation(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);
        $employee = User::factory()->create([
            'role' => UserRole::Employee->value,
            'relationship_manager_id' => $rm->id,
        ]);

        $ownTask = Task::factory()->create(['created_by' => $rm->id, 'assigned_to' => $rm->id]);
        $teamTask = Task::factory()->create(['created_by' => $rm->id, 'assigned_to' => $employee->id]);

        $response = $this->actingAs($rm, 'sanctum')->getJson('/api/v1/tasks?assigned_to=team');
        $response->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($teamTask->id, $ids);
        $this->assertNotContains($ownTask->id, $ids);
    }

    public function test_only_hierarchy_roles_may_delete_a_task(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $task = Task::factory()->create(['created_by' => $employee->id, 'assigned_to' => $employee->id]);

        $this->actingAs($employee, 'sanctum')
            ->deleteJson("/api/v1/tasks/{$task->id}")
            ->assertForbidden();

        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);
        $rmTask = Task::factory()->create(['created_by' => $rm->id, 'assigned_to' => $rm->id]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/tasks/{$rmTask->id}")
            ->assertOk();

        $this->assertDatabaseMissing('tasks', ['id' => $rmTask->id]);
    }

    public function test_counts_endpoint_matches_visible_set(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);

        Task::factory()->create([
            'created_by' => $employee->id,
            'assigned_to' => $employee->id,
            'status' => 'pending',
            'due_at' => now()->subDays(2),
        ]);
        Task::factory()->create([
            'created_by' => $employee->id,
            'assigned_to' => $employee->id,
            'status' => 'completed',
            'due_at' => now()->subDay(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($employee, 'sanctum')->getJson('/api/v1/tasks/counts');
        $response->assertOk();
        $this->assertSame(1, $response->json('data.open'));
        $this->assertSame(1, $response->json('data.overdue'));
        $this->assertSame(1, $response->json('data.completed'));
    }
}
