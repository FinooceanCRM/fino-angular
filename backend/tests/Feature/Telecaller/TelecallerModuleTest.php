<?php

namespace Tests\Feature\Telecaller;

use App\Enums\Department;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TelecallerModuleTest extends TestCase
{
    use RefreshDatabase;

    private function telecaller(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => UserRole::Telecaller,
            'department' => Department::PersonalLoan,
            'is_active' => true,
        ], $attributes));
    }

    public function test_telecaller_routes_are_registered(): void
    {
        foreach ([
            'api.v1.telecallers.dashboard',
            'api.v1.telecallers.profile.show',
            'api.v1.telecallers.profile.update',
            'api.v1.telecallers.follow-ups.index',
            'api.v1.leads.telecaller-follow-ups.index',
            'api.v1.leads.telecaller-follow-ups.store',
            'api.v1.telecaller-follow-ups.complete',
            'api.v1.telecaller-follow-ups.reschedule',
        ] as $name) {
            $this->assertNotNull(app('router')->getRoutes()->getByName($name), "Missing route {$name}");
        }
    }

    public function test_telecaller_can_load_dashboard(): void
    {
        $telecaller = $this->telecaller();
        Sanctum::actingAs($telecaller);

        LoanLead::factory()->create([
            'created_by' => $telecaller->id,
            'department' => Department::PersonalLoan,
            'status' => LeadStatus::New,
        ]);

        $this->getJson('/api/v1/telecallers/dashboard')
            ->assertOk()
            ->assertJsonPath('data.user.email', $telecaller->email)
            ->assertJsonStructure([
                'data' => [
                    'welcome', 'user', 'role', 'account_status',
                    'submitted_leads' => ['total', 'by_status'],
                    'recent_leads',
                    'pd_queue' => ['pending', 'completed'],
                    'pending_follow_ups',
                    'follow_up_reminders' => ['overdue', 'today', 'upcoming'],
                ],
            ])
            ->assertJsonPath('data.submitted_leads.total', 1);
    }

    public function test_telecaller_can_read_and_update_own_profile(): void
    {
        $telecaller = $this->telecaller();
        Sanctum::actingAs($telecaller);

        $this->getJson('/api/v1/telecallers/profile')->assertOk();

        $this->putJson('/api/v1/telecallers/profile', [
            'name' => 'Updated Telecaller',
            'designation' => 'Senior Caller',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'pincode' => '411001',
        ])
            ->assertOk()
            ->assertJsonPath('data.designation', 'Senior Caller');

        $this->assertDatabaseHas('users', ['id' => $telecaller->id, 'name' => 'Updated Telecaller']);
        $this->assertDatabaseHas('telecallers', ['user_id' => $telecaller->id, 'city' => 'Pune']);
    }

    public function test_telecaller_sees_own_submitted_leads_and_pd_queue_leads_but_not_others(): void
    {
        $telecaller = $this->telecaller();
        $employee = User::factory()->create(['role' => UserRole::Employee]);
        $otherTelecaller = $this->telecaller(['department' => Department::HomeLoan]);

        $ownLead = LoanLead::factory()->create([
            'created_by' => $telecaller->id,
            'department' => Department::MortgageLoan,
        ]);
        $pdQueueLead = LoanLead::factory()->create([
            'created_by' => $employee->id,
            'department' => Department::PersonalLoan,
        ]);
        $otherDepartmentLead = LoanLead::factory()->create([
            'created_by' => $employee->id,
            'department' => Department::HomeLoan,
        ]);
        LoanLead::factory()->create([
            'created_by' => $otherTelecaller->id,
            'department' => Department::HomeLoan,
        ]);

        Sanctum::actingAs($telecaller);

        $response = $this->getJson('/api/v1/leads?per_page=50')->assertOk();
        $visibleIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($ownLead->id, $visibleIds);
        $this->assertContains($pdQueueLead->id, $visibleIds);
        $this->assertNotContains($otherDepartmentLead->id, $visibleIds);

        $this->getJson("/api/v1/leads/{$ownLead->id}")->assertOk();
        $this->getJson("/api/v1/leads/{$pdQueueLead->id}")->assertOk();
        $this->getJson("/api/v1/leads/{$otherDepartmentLead->id}")->assertNotFound();
    }

    public function test_telecaller_cannot_assign_or_reassign_leads(): void
    {
        $telecaller = $this->telecaller();
        $lead = LoanLead::factory()->create([
            'created_by' => $telecaller->id,
            'department' => Department::PersonalLoan,
        ]);
        $employee = User::factory()->create(['role' => UserRole::Employee]);

        Sanctum::actingAs($telecaller);

        $this->postJson("/api/v1/leads/{$lead->id}/assign", ['assignee_id' => $employee->id])
            ->assertForbidden();
    }

    public function test_telecaller_appears_in_assignable_users_for_manager_and_super_admin(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->telecaller(['name' => 'Priya Caller']);

        Sanctum::actingAs($manager);
        $this->getJson('/api/v1/leads/assignable-users')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Priya Caller', 'role' => 'telecaller']);

        Sanctum::actingAs($superAdmin);
        $this->getJson('/api/v1/leads/assignable-users')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Priya Caller', 'role' => 'telecaller']);
    }

    public function test_manager_can_assign_a_lead_to_a_telecaller_in_the_matching_department(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $telecaller = $this->telecaller(['department' => Department::HomeLoan]);
        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::New,
            'department' => Department::HomeLoan,
            'assigned_manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($manager);

        $this->postJson("/api/v1/leads/{$lead->id}/assign", ['assignee_id' => $telecaller->id])
            ->assertOk()
            ->assertJsonPath('data.assigned_telecaller.id', $telecaller->id);

        $this->assertDatabaseHas('loan_leads', [
            'id' => $lead->id,
            'assigned_telecaller_id' => $telecaller->id,
        ]);

        Sanctum::actingAs($telecaller);
        $this->getJson("/api/v1/leads/{$lead->id}")->assertOk();
    }

    public function test_manager_cannot_assign_a_lead_to_a_telecaller_in_a_different_department(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager]);
        $telecaller = $this->telecaller(['department' => Department::MortgageLoan]);
        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::New,
            'department' => Department::PersonalLoan,
            'assigned_manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($manager);

        $this->postJson("/api/v1/leads/{$lead->id}/assign", ['assignee_id' => $telecaller->id])
            ->assertStatus(422);
    }

    public function test_telecaller_can_change_status_only_on_own_leads(): void
    {
        $telecaller = $this->telecaller();
        $employee = User::factory()->create(['role' => UserRole::Employee]);

        $ownLead = LoanLead::factory()->create([
            'created_by' => $telecaller->id,
            'department' => Department::PersonalLoan,
            'status' => LeadStatus::New,
        ]);
        $pdQueueLead = LoanLead::factory()->create([
            'created_by' => $employee->id,
            'department' => Department::PersonalLoan,
            'status' => LeadStatus::New,
        ]);

        Sanctum::actingAs($telecaller);

        // New -> Assigned is the only valid non-terminal transition from New
        // (see LeadStatus::allowedNextStatuses()); this test is about
        // ownership-based authorization, not the FSM itself.
        $this->postJson("/api/v1/leads/{$ownLead->id}/status", [
            'status' => LeadStatus::Assigned->value,
        ])->assertOk();

        $this->postJson("/api/v1/leads/{$pdQueueLead->id}/status", [
            'status' => LeadStatus::Assigned->value,
        ])->assertForbidden();
    }

    public function test_telecaller_follow_up_lifecycle(): void
    {
        $telecaller = $this->telecaller();
        $lead = LoanLead::factory()->create([
            'created_by' => $telecaller->id,
            'department' => Department::PersonalLoan,
        ]);

        Sanctum::actingAs($telecaller);

        $store = $this->postJson("/api/v1/leads/{$lead->id}/telecaller-follow-ups", [
            'type' => 'call',
            'notes' => 'Spoke with applicant.',
            'next_follow_up_at' => now()->addDay()->toIso8601String(),
        ])->assertCreated();

        $followUpId = $store->json('data.id');

        $this->getJson("/api/v1/leads/{$lead->id}/telecaller-follow-ups")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->postJson("/api/v1/telecaller-follow-ups/{$followUpId}/reschedule", [
            'next_follow_up_at' => now()->addDays(2)->toIso8601String(),
        ])->assertOk();

        $this->postJson("/api/v1/telecaller-follow-ups/{$followUpId}/complete")
            ->assertOk()
            ->assertJsonPath('data.completed_at', fn ($value) => $value !== null);

        $this->assertDatabaseHas('lead_status_history', [
            'loan_lead_id' => $lead->id,
            'remarks' => $telecaller->name.' logged a call follow-up: Spoke with applicant.',
        ]);
        $this->assertDatabaseHas('lead_status_history', [
            'loan_lead_id' => $lead->id,
            'remarks' => $telecaller->name.' rescheduled a follow-up.',
        ]);
        $this->assertDatabaseHas('lead_status_history', [
            'loan_lead_id' => $lead->id,
            'remarks' => $telecaller->name.' marked a follow-up complete.',
        ]);

        $this->getJson('/api/v1/telecallers/follow-ups')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_telecaller_follow_up_reminder_counts_and_filters(): void
    {
        $telecaller = $this->telecaller();
        $lead = LoanLead::factory()->create([
            'created_by' => $telecaller->id,
            'department' => Department::PersonalLoan,
        ]);

        Sanctum::actingAs($telecaller);

        $overdue = $this->postJson("/api/v1/leads/{$lead->id}/telecaller-follow-ups", [
            'type' => 'call',
            'priority' => 'high',
            'next_follow_up_at' => now()->subDays(2)->toIso8601String(),
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/leads/{$lead->id}/telecaller-follow-ups", [
            'type' => 'reminder',
            'priority' => 'low',
            'next_follow_up_at' => now()->toIso8601String(),
        ])->assertCreated();

        $this->postJson("/api/v1/leads/{$lead->id}/telecaller-follow-ups", [
            'type' => 'meeting',
            'next_follow_up_at' => now()->addDays(3)->toIso8601String(),
        ])->assertCreated()->assertJsonPath('data.priority', 'medium');

        $this->getJson('/api/v1/telecallers/dashboard')
            ->assertOk()
            ->assertJsonPath('data.follow_up_reminders.overdue', 1)
            ->assertJsonPath('data.follow_up_reminders.today', 1)
            ->assertJsonPath('data.follow_up_reminders.upcoming', 1);

        $this->getJson('/api/v1/telecallers/follow-ups?filter=overdue')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $overdue)
            ->assertJsonPath('data.0.is_overdue', true);

        $this->getJson('/api/v1/telecallers/follow-ups?filter=all')->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/telecallers/follow-ups?filter=today')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/telecallers/follow-ups?filter=upcoming')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/telecallers/follow-ups?filter=completed')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_telecaller_can_complete_pd_once(): void
    {
        $telecaller = $this->telecaller();
        $employee = User::factory()->create(['role' => UserRole::Employee]);
        $lead = LoanLead::factory()->create([
            'created_by' => $employee->id,
            'department' => Department::PersonalLoan,
        ]);

        Sanctum::actingAs($telecaller);

        $this->postJson("/api/v1/leads/{$lead->id}/pd-complete")->assertOk();
        $this->postJson("/api/v1/leads/{$lead->id}/pd-complete")->assertForbidden();
    }

    public function test_non_telecaller_roles_are_forbidden(): void
    {
        foreach ([UserRole::SuperAdmin, UserRole::Manager, UserRole::RelationshipManager, UserRole::Employee] as $role) {
            $user = User::factory()->create(['role' => $role]);

            Sanctum::actingAs($user);
            $this->getJson('/api/v1/telecallers/dashboard')->assertForbidden();
        }
    }

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/v1/telecallers/dashboard')->assertUnauthorized();
    }
}
