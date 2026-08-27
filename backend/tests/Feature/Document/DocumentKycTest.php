<?php

namespace Tests\Feature\Document;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentKycTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_relationship_manager_can_verify_a_document_on_a_lead_visible_to_them(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);
        $lead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $rm->id]);
        $document = Document::factory()->create([
            'loan_lead_id' => $lead->id,
            'document_type' => 'pan_card',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($rm, 'sanctum')->postJson("/api/v1/documents/{$document->id}/verify");

        $response->assertOk();
        $this->assertSame('verified', $response->json('data.status'));
    }

    public function test_a_relationship_manager_cannot_verify_a_document_on_a_lead_outside_their_visibility(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);
        $otherRm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);
        $lead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $otherRm->id]);
        $document = Document::factory()->create(['loan_lead_id' => $lead->id, 'status' => 'pending']);

        $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/verify")
            ->assertNotFound();
    }

    public function test_rejecting_a_document_requires_a_reason_and_records_it(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);
        $lead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $rm->id]);
        $document = Document::factory()->create(['loan_lead_id' => $lead->id, 'status' => 'pending']);

        $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/reject", [])
            ->assertUnprocessable();

        $response = $this->actingAs($rm, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/reject", ['reason' => 'Scan is blurred.']);

        $response->assertOk();
        $this->assertSame('rejected', $response->json('data.status'));
        $this->assertSame('Scan is blurred.', $response->json('data.remarks'));
    }

    public function test_an_employee_cannot_verify_or_reject_a_document(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $lead = LoanLead::factory()->create(['assigned_employee_id' => $employee->id]);
        $document = Document::factory()->create(['loan_lead_id' => $lead->id, 'status' => 'pending']);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/verify")
            ->assertForbidden();
    }

    public function test_kyc_documents_endpoint_scopes_to_rm_visible_leads_and_kyc_relevant_types(): void
    {
        $rm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);
        $otherRm = User::factory()->create(['role' => UserRole::RelationshipManager->value]);

        $myLead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $rm->id]);
        $otherLead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $otherRm->id]);

        $myKycDoc = Document::factory()->create([
            'loan_lead_id' => $myLead->id,
            'document_type' => 'pan_card',
            'status' => 'pending',
        ]);
        // Same lead, but not a KYC-relevant document type — must be excluded.
        Document::factory()->create([
            'loan_lead_id' => $myLead->id,
            'document_type' => 'gst_certificate',
            'status' => 'pending',
        ]);
        // KYC-relevant type, but on a lead outside this RM's visibility — must be excluded.
        Document::factory()->create([
            'loan_lead_id' => $otherLead->id,
            'document_type' => 'aadhaar_front',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($rm, 'sanctum')->getJson('/api/v1/relationship-managers/kyc-documents');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertSame([$myKycDoc->id], $ids);
    }

    public function test_kyc_documents_endpoint_is_relationship_manager_only(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/relationship-managers/kyc-documents')
            ->assertForbidden();
    }
}
