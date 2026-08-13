<?php

namespace Tests\Feature\Lead;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadWorkflowTest extends TestCase
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

        return compact('manager', 'rm', 'employee', 'connector');
    }

    public function test_connector_can_create_a_lead_and_only_sees_its_own(): void
    {
        ['connector' => $connector] = $this->hierarchy();
        $other = User::factory()->create(['role' => UserRole::Connector->value]);
        LoanLead::factory()->create(['connector_id' => $other->id, 'created_by' => $other->id]);

        $response = $this->actingAs($connector, 'sanctum')->postJson('/api/v1/leads', [
            'applicant_name' => 'Test Applicant',
            'applicant_phone' => '9876543210',
            'loan_type' => 'home',
            'loan_amount' => 2500000,
            'city' => 'Pune',
            'state' => 'Maharashtra',
        ]);

        $response->assertCreated();
        $this->assertSame(LeadStatus::New->value, $response->json('data.status'));

        $list = $this->actingAs($connector, 'sanctum')->getJson('/api/v1/leads');
        $list->assertOk();
        $this->assertCount(1, $list->json('data'));
    }

    public function test_relationship_manager_can_assign_a_lead_to_own_employee(): void
    {
        ['rm' => $rm, 'employee' => $employee] = $this->hierarchy();

        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::New->value,
            'assigned_relationship_manager_id' => $rm->id,
        ]);

        $response = $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/assign", ['assignee_id' => $employee->id]);

        $response->assertOk();
        $this->assertSame($employee->id, $response->json('data.assigned_employee.id'));
        $this->assertDatabaseHas('lead_assignments', [
            'loan_lead_id' => $lead->id,
            'assigned_to' => $employee->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'type' => 'lead.assigned',
        ]);
    }

    public function test_employee_cannot_see_leads_assigned_to_others(): void
    {
        ['employee' => $employee] = $this->hierarchy();
        $lead = LoanLead::factory()->create(['assigned_employee_id' => null]);

        $this->actingAs($employee, 'sanctum')
            ->getJson("/api/v1/leads/{$lead->id}")
            ->assertNotFound();
    }

    public function test_status_change_is_recorded_in_history(): void
    {
        ['rm' => $rm] = $this->hierarchy();
        $lead = LoanLead::factory()->create([
            'status' => LeadStatus::Assigned->value,
            'assigned_relationship_manager_id' => $rm->id,
        ]);

        $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/status", [
                'status' => LeadStatus::UnderReview->value,
                'remarks' => 'Docs verified.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('lead_status_history', [
            'loan_lead_id' => $lead->id,
            'to_status' => LeadStatus::UnderReview->value,
        ]);
    }

    public function test_matching_engine_stores_eligible_banks(): void
    {
        ['rm' => $rm] = $this->hierarchy();

        $lead = LoanLead::factory()->create([
            'assigned_relationship_manager_id' => $rm->id,
            'loan_type' => 'home',
            'loan_amount' => 3000000,
            'monthly_income' => 120000,
            'credit_score' => 780,
            'employment_type' => 'salaried',
        ]);

        BankCriteria::query()->create([
            'bank_name' => 'Test Bank',
            'product_name' => 'Home Prime',
            'loan_type' => 'home',
            'min_loan_amount' => 500000,
            'max_loan_amount' => 20000000,
            'min_monthly_income' => 50000,
            'min_credit_score' => 700,
            'employment_type' => 'salaried',
            'interest_rate' => 8.5,
            'is_active' => true,
        ]);

        BankCriteria::query()->create([
            'bank_name' => 'Strict Bank',
            'product_name' => 'Home Elite',
            'loan_type' => 'home',
            'min_loan_amount' => 500000,
            'max_loan_amount' => 20000000,
            'min_monthly_income' => 500000,
            'min_credit_score' => 850,
            'is_active' => true,
        ]);

        $response = $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/leads/{$lead->id}/match");

        $response->assertOk();
        $this->assertSame(1, $response->json('data.matched'));
        $this->assertDatabaseCount('lead_matches', 1);
    }

    public function test_only_super_admin_can_create_bank_criteria(): void
    {
        ['manager' => $manager] = $this->hierarchy();
        $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin->value]);

        $payload = [
            'bank_name' => 'New Bank',
            'product_name' => 'Personal Flexi',
            'loan_type' => 'personal',
            'min_loan_amount' => 50000,
            'max_loan_amount' => 1000000,
            'min_monthly_income' => 25000,
            'is_active' => true,
        ];

        $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/banks', $payload)
            ->assertForbidden();

        $this->actingAs($superAdmin, 'sanctum')
            ->postJson('/api/v1/banks', $payload)
            ->assertCreated();
    }
}
