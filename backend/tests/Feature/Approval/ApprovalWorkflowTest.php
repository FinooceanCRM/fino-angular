<?php

namespace Tests\Feature\Approval;

use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_any_authenticated_role_can_create_an_approval_request(): void
    {
        $banker = User::factory()->create(['role' => UserRole::Banker->value]);

        $response = $this->actingAs($banker, 'sanctum')->postJson('/api/v1/approvals', [
            'type' => 'banker',
            'title' => 'Karan Oberoi — Yes Bank',
            'subtitle' => 'New banker registration, Mumbai branch',
        ]);

        $response->assertCreated();
        $this->assertSame('pending', $response->json('data.status'));
        $this->assertSame($banker->id, $response->json('data.requested_by.id'));

        $this->assertDatabaseHas('approvals', [
            'type' => 'banker',
            'title' => 'Karan Oberoi — Yes Bank',
            'requested_by' => $banker->id,
            'status' => 'pending',
        ]);
    }

    public function test_a_manager_can_approve_a_pending_request(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $approval = Approval::factory()->create(['status' => 'pending', 'type' => 'document']);

        $response = $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/approve", ['remarks' => 'Looks good.']);

        $response->assertOk();
        $this->assertSame('approved', $response->json('data.status'));
        $this->assertSame($manager->id, $response->json('data.decided_by.id'));
        $this->assertSame('Looks good.', $response->json('data.decision_remarks'));
    }

    public function test_a_manager_can_reject_a_pending_request_with_a_reason(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $approval = Approval::factory()->create(['status' => 'pending', 'type' => 'lead']);

        $response = $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/reject", ['remarks' => 'Insufficient documentation.']);

        $response->assertOk();
        $this->assertSame('rejected', $response->json('data.status'));
        $this->assertSame('Insufficient documentation.', $response->json('data.decision_remarks'));
    }

    public function test_rejecting_without_a_reason_is_rejected_by_validation(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $approval = Approval::factory()->create(['status' => 'pending', 'type' => 'lead']);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/reject", [])
            ->assertUnprocessable();
    }

    public function test_a_non_manager_role_cannot_approve_or_reject(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $approval = Approval::factory()->create(['status' => 'pending', 'type' => 'banker']);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/approve")
            ->assertForbidden();

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/reject", ['remarks' => 'No.'])
            ->assertForbidden();
    }

    public function test_any_authenticated_user_can_add_and_list_comments(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $approval = Approval::factory()->create(['status' => 'pending', 'type' => 'document']);

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/comments", ['body' => 'Checking with compliance.']);

        $response->assertCreated();
        $this->assertSame('Checking with compliance.', $response->json('data.body'));
        $this->assertSame($employee->name, $response->json('data.author'));

        $list = $this->actingAs($employee, 'sanctum')->getJson("/api/v1/approvals/{$approval->id}/comments");
        $list->assertOk();
        $this->assertCount(1, $list->json('data'));
    }

    public function test_index_can_be_filtered_by_type_and_status(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        Approval::factory()->create(['type' => 'banker', 'status' => 'pending']);
        Approval::factory()->create(['type' => 'lead', 'status' => 'pending']);
        Approval::factory()->create(['type' => 'banker', 'status' => 'approved']);

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/approvals?type=banker&status=pending');

        $response->assertOk();
        $rows = $response->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame('banker', $rows[0]['type']);
        $this->assertSame('pending', $rows[0]['status']);
    }

    public function test_deciding_an_already_decided_request_fails(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $approval = Approval::factory()->create(['status' => 'approved', 'type' => 'banker']);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/approvals/{$approval->id}/approve")
            ->assertStatus(422);
    }
}
