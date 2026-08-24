<?php

namespace Tests\Feature\Lead;

use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadPdWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function hierarchy(): array
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);
        $employee = User::factory()->create([
            'role' => UserRole::Employee->value,
            'manager_id' => $manager->id,
            'relationship_manager_id' => $rm->id,
        ]);
        $connector = User::factory()->create(['role' => UserRole::Connector->value]);
        $banker = User::factory()->create(['role' => UserRole::Banker->value]);
        $telecaller = User::factory()->create(['role' => UserRole::Telecaller->value]);
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin->value]);

        return compact('manager', 'rm', 'employee', 'connector', 'banker', 'telecaller', 'superAdmin');
    }

    private function pdPayload(): array
    {
        return [
            'LOAN_TYPE' => 'Home Loan',
            'Age' => 34,
            'Marital_Status' => 'Married',
            'Type_of_Customer' => 'If Salaried',
            'Current_Residential_Address' => [
                'address_line_1' => '221B Baker Street',
                'city' => 'Pune',
                'state' => 'Maharashtra',
            ],
            'existing_loans' => [
                ['Loan_Type' => 'Personal Loan', 'EMI_Amount' => 5000, 'Status' => 'Active'],
                ['Loan_Type' => 'Car Loan', 'EMI_Amount' => 8000, 'Status' => 'Closed'],
            ],
            'family_members' => [
                ['Relation_of_Member' => 'Father', 'Co_Borrower' => 'YES', 'Income_Amount' => 40000],
            ],
            'partner_directors' => [],
        ];
    }

    public function test_telecaller_can_submit_full_pd(): void
    {
        ['telecaller' => $telecaller] = $this->hierarchy();
        $lead = LoanLead::factory()->create(['assigned_telecaller_id' => $telecaller->id]);

        $response = $this->actingAs($telecaller, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd", $this->pdPayload());

        $response->assertOk();
        $this->assertNotNull($response->json('data.pd_completed_at'));
        $this->assertDatabaseHas('loan_leads', ['id' => $lead->id, 'pd_completed_by' => $telecaller->id]);

        $lead->refresh();
        $this->assertSame('Home Loan', $lead->pd_details['LOAN_TYPE']);
        $this->assertCount(2, $lead->pd_details['existing_loans']);
        $this->assertSame('Pune', $lead->pd_details['Current_Residential_Address']['city']);
    }

    public function test_manager_can_submit_full_pd(): void
    {
        ['manager' => $manager] = $this->hierarchy();
        $lead = LoanLead::factory()->create(['assigned_manager_id' => $manager->id]);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd", $this->pdPayload())
            ->assertOk();
    }

    public function test_super_admin_can_submit_full_pd(): void
    {
        ['superAdmin' => $superAdmin] = $this->hierarchy();
        $lead = LoanLead::factory()->create();

        $this->actingAs($superAdmin, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd", $this->pdPayload())
            ->assertOk();
    }

    public function test_relationship_manager_employee_banker_connector_cannot_submit_full_pd(): void
    {
        ['rm' => $rm, 'employee' => $employee, 'banker' => $banker, 'connector' => $connector] = $this->hierarchy();

        $leadForRm = LoanLead::factory()->create(['assigned_relationship_manager_id' => $rm->id]);
        $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/leads/{$leadForRm->id}/pd", $this->pdPayload())
            ->assertForbidden();

        $leadForEmployee = LoanLead::factory()->create(['assigned_employee_id' => $employee->id]);
        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/leads/{$leadForEmployee->id}/pd", $this->pdPayload())
            ->assertForbidden();

        $leadForBanker = LoanLead::factory()->create(['assigned_banker_id' => $banker->id]);
        $this->actingAs($banker, 'sanctum')
            ->postJson("/api/v1/leads/{$leadForBanker->id}/pd", $this->pdPayload())
            ->assertForbidden();

        $leadForConnector = LoanLead::factory()->create(['connector_id' => $connector->id, 'created_by' => $connector->id]);
        $this->actingAs($connector, 'sanctum')
            ->postJson("/api/v1/leads/{$leadForConnector->id}/pd", $this->pdPayload())
            ->assertForbidden();
    }

    public function test_full_pd_cannot_be_submitted_twice(): void
    {
        ['telecaller' => $telecaller, 'manager' => $manager] = $this->hierarchy();
        $lead = LoanLead::factory()->create([
            'assigned_telecaller_id' => $telecaller->id,
            'assigned_manager_id' => $manager->id,
        ]);

        $this->actingAs($telecaller, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd", $this->pdPayload())
            ->assertOk();

        // Blocked at the policy layer (403) once pd_completed_at is set —
        // LoanLeadPolicy::submitPd()'s `pd_completed_at === null` guard runs
        // before the controller ever reaches LeadService::submitPd(), so the
        // service's own DomainException guard is defense-in-depth here, not
        // what actually fires for a second attempt via the API.
        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd", $this->pdPayload())
            ->assertForbidden();
    }

    public function test_full_pd_completion_is_recorded_in_timeline_and_notifies_hierarchy(): void
    {
        ['telecaller' => $telecaller, 'manager' => $manager, 'rm' => $rm] = $this->hierarchy();
        $lead = LoanLead::factory()->create([
            'assigned_telecaller_id' => $telecaller->id,
            'assigned_manager_id' => $manager->id,
            'assigned_relationship_manager_id' => $rm->id,
        ]);

        $this->actingAs($telecaller, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd", $this->pdPayload())
            ->assertOk();

        $this->assertDatabaseHas('lead_status_history', [
            'loan_lead_id' => $lead->id,
            'changed_by' => $telecaller->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $manager->id,
            'type' => 'lead.full_pd_completed',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $rm->id,
            'type' => 'lead.full_pd_completed',
        ]);
    }

    public function test_old_pd_complete_endpoint_still_works_unmodified(): void
    {
        ['telecaller' => $telecaller] = $this->hierarchy();
        $lead = LoanLead::factory()->create(['assigned_telecaller_id' => $telecaller->id]);

        $this->actingAs($telecaller, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/pd-complete", ['remarks' => 'Quick check.'])
            ->assertOk();

        $this->assertDatabaseHas('loan_leads', [
            'id' => $lead->id,
            'pd_completed_by' => $telecaller->id,
        ]);
    }
}
