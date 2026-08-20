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

        $this->postJson("/api/v1/leads/{$ownLead->id}/status", [
            'status' => LeadStatus::InProgress->value,
        ])->assertOk();

        $this->postJson("/api/v1/leads/{$pdQueueLead->id}/status", [
            'status' => LeadStatus::InProgress->value,
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
