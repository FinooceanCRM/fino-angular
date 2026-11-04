<?php

namespace Tests\Feature\Inquiry;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\InquiryRoutingRule;
use App\Models\LeadAssignment;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InquiryQueueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Most tests here simulate website leads arriving anonymously, which
        // is off by default; the default behaviour has its own test below.
        config(['website.anonymous_inquiries' => true]);
    }

    public function test_anonymous_inquiry_is_refused_by_default_but_a_customer_can_apply(): void
    {
        config(['website.anonymous_inquiries' => false]);

        $this->submit()->assertForbidden();
        $this->assertSame(0, LoanLead::query()->count());

        // Eligibility stays public and creates nothing.
        $this->postJson('/api/v1/public/eligibility', [
            'product' => 'home-loan', 'loan_amount' => 2500000, 'monthly_income' => 90000,
        ])->assertOk();
        $this->assertSame(0, LoanLead::query()->count());

        $this->postJson('/api/v1/customer/auth/register', [
            'name' => 'Cust', 'email' => 'cust2@example.test', 'phone' => '9000000002',
            'password' => 'Secret123', 'password_confirmation' => 'Secret123', 'terms' => true,
        ])->assertCreated();
        Sanctum::actingAs(User::query()->where('email', 'cust2@example.test')->firstOrFail());

        $this->submit()->assertCreated();
        $this->assertSame('customer_portal', LoanLead::query()->firstOrFail()->source);
    }

    /** @return array<string, mixed> */
    private function inquiry(array $o = []): array
    {
        return array_merge([
            'applicant_name' => 'Anita Rao',
            'applicant_phone' => '+91 98765 43210',
            'applicant_email' => 'anita@example.test',
            'product' => 'home-loan',
            'loan_amount' => 2500000,
            'tenure_months' => 240,
            'monthly_income' => 90000,
            'existing_emi' => 5000,
            'employment_type' => 'salaried',
            'city' => 'Nagpur',
            'consent' => true,
        ], $o);
    }

    private function submit(array $o = [])
    {
        return $this->postJson('/api/v1/public/inquiries', $this->inquiry($o));
    }

    private function user(UserRole $role, array $o = []): User
    {
        return User::factory()->role($role)->create($o);
    }

    // ---- public intake -------------------------------------------------

    public function test_public_catalogue_and_eligibility_need_no_login(): void
    {
        $this->getJson('/api/v1/public/loan-products')->assertOk()->assertJsonPath('data.0.slug', 'personal-loan');
        $this->getJson('/api/v1/public/loan-products/nope')->assertNotFound();
        $this->postJson('/api/v1/public/eligibility', [
            'product' => 'personal-loan', 'loan_amount' => 200000, 'monthly_income' => 80000, 'tenure_months' => 36,
        ])->assertOk()->assertJsonPath('data.band', 'likely');
    }

    public function test_eligibility_flags_unaffordable_requests_and_never_promises_approval(): void
    {
        $res = $this->postJson('/api/v1/public/eligibility', [
            'product' => 'personal-loan', 'loan_amount' => 5000000, 'monthly_income' => 20000, 'tenure_months' => 12,
        ])->assertOk();

        $this->assertSame('needs_review', $res->json('data.band'));
        $this->assertStringContainsString('not an approval', $res->json('data.disclaimer'));
    }

    public function test_anonymous_inquiry_creates_a_website_lead_visible_in_queue_data(): void
    {
        $this->submit()->assertCreated()->assertJsonPath('success', true);

        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('website', $lead->source);
        $this->assertSame('new', $lead->inquiry_status);
        $this->assertSame('home', $lead->loan_type);
        $this->assertSame('home_loan', $lead->department->value);
        $this->assertSame('9876543210', $lead->applicant_phone); // normalised
        $this->assertNull($lead->customer_id);
        $this->assertNull($lead->created_by);
        $this->assertSame('home-loan', $lead->details['product']);
        $this->assertArrayHasKey('eligibility', $lead->details);
    }

    public function test_inquiry_validation_and_honeypot(): void
    {
        $this->submit(['applicant_phone' => 'abc'])->assertStatus(422);
        $this->submit(['loan_amount' => 5])->assertStatus(422);
        $this->submit(['consent' => false])->assertStatus(422);
        $this->submit(['product' => 'made-up'])->assertStatus(422);

        $this->submit(['website' => 'http://spam'])->assertCreated(); // bot sees success
        $this->assertSame(0, LoanLead::query()->count());
    }

    public function test_captcha_is_enforced_only_when_configured(): void
    {
        config(['services.captcha.secret' => 'x']);
        $this->mock(CaptchaVerifierInterface::class, fn ($m) => $m->shouldReceive('verify')->andReturn(false));

        $this->submit(['captcha_token' => 'bad'])->assertStatus(422);
        $this->assertSame(0, LoanLead::query()->count());
    }

    public function test_same_idempotency_key_creates_one_lead(): void
    {
        $this->submit(['idempotency_key' => 'abc-123'])->assertCreated();
        $this->submit(['idempotency_key' => 'abc-123'])->assertCreated();

        $this->assertSame(1, LoanLead::query()->count());
    }

    public function test_resubmission_for_same_phone_and_product_is_flagged_not_duplicated(): void
    {
        $this->submit()->assertCreated();
        $this->submit(['applicant_phone' => '9876543210'])->assertCreated();

        $this->assertSame(1, LoanLead::query()->count());
        $this->assertSame(1, LoanLead::query()->firstOrFail()->resubmission_count);
    }

    public function test_different_loan_type_for_same_phone_is_a_separate_lead(): void
    {
        $this->submit()->assertCreated();
        $this->submit(['product' => 'personal-loan'])->assertCreated();

        $this->assertSame(2, LoanLead::query()->count());
    }

    public function test_staff_token_does_not_turn_a_public_inquiry_into_a_customer_one(): void
    {
        Sanctum::actingAs($this->user(UserRole::Manager));
        $this->submit()->assertCreated();

        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('website', $lead->source);
        $this->assertNull($lead->customer_id);
    }

    public function test_registered_customer_submission_links_to_their_account(): void
    {
        $this->postJson('/api/v1/customer/auth/register', [
            'name' => 'Cust', 'email' => 'cust@example.test', 'phone' => '9000000001',
            'password' => 'Secret123', 'password_confirmation' => 'Secret123', 'terms' => true,
        ])->assertCreated();
        Sanctum::actingAs(User::query()->where('email', 'cust@example.test')->firstOrFail());

        $this->submit()->assertCreated();

        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('customer_portal', $lead->source);
        $this->assertNotNull($lead->customer_id);
    }

    // ---- access control ------------------------------------------------

    public function test_only_telecaller_and_super_admin_can_open_the_queue(): void
    {
        $this->submit()->assertCreated();
        $id = LoanLead::query()->value('id');

        foreach ([UserRole::Telecaller, UserRole::SuperAdmin] as $role) {
            Sanctum::actingAs($this->user($role));
            $this->getJson('/api/v1/inquiries')->assertOk()->assertJsonCount(1, 'data');
            $this->getJson("/api/v1/inquiries/{$id}")->assertOk()->assertJsonPath('data.applicant_name', 'Anita Rao');
        }

        foreach ([UserRole::Manager, UserRole::RelationshipManager, UserRole::Employee, UserRole::Banker,
            UserRole::Connector, UserRole::Affiliate, UserRole::Accounts, UserRole::Vendor] as $role) {
            Sanctum::actingAs($this->user($role));
            $this->getJson('/api/v1/inquiries')->assertForbidden();
            $this->getJson("/api/v1/inquiries/{$id}")->assertForbidden();
            $this->postJson("/api/v1/inquiries/{$id}/assign", ['manager_id' => 1])->assertForbidden();
        }
    }

    public function test_guests_cannot_reach_the_queue(): void
    {
        $this->getJson('/api/v1/inquiries')->assertUnauthorized();
    }

    public function test_website_lead_is_not_exposed_to_other_roles_through_existing_lead_list(): void
    {
        $this->submit()->assertCreated();

        foreach ([UserRole::Manager, UserRole::Banker, UserRole::Employee, UserRole::RelationshipManager] as $role) {
            Sanctum::actingAs($this->user($role));
            $this->getJson('/api/v1/leads')->assertOk()->assertJsonCount(0, 'data');
        }
    }

    public function test_queue_excludes_non_inquiry_leads_and_supports_filters_search_and_sorting(): void
    {
        $this->submit()->assertCreated();
        $this->submit(['applicant_name' => 'Zed', 'applicant_phone' => '9000011111', 'product' => 'personal-loan', 'loan_amount' => 100000])->assertCreated();
        LoanLead::factory()->create(['source' => 'internal', 'applicant_name' => 'Internal Person']);

        Sanctum::actingAs($this->user(UserRole::SuperAdmin));

        $this->getJson('/api/v1/inquiries')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/v1/inquiries?loan_type=personal')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/inquiries?search=Zed')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/inquiries?source=customer_portal')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/v1/inquiries?sort=loan_amount&dir=asc')->assertJsonPath('data.0.applicant_name', 'Zed');
        $this->getJson('/api/v1/inquiries?search=Internal')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/v1/inquiries/stats')->assertOk()->assertJsonPath('data.total', 2);
    }

    public function test_inquiry_endpoint_does_not_serve_internal_leads(): void
    {
        $lead = LoanLead::factory()->create(['source' => 'internal']);

        Sanctum::actingAs($this->user(UserRole::SuperAdmin));
        $this->getJson("/api/v1/inquiries/{$lead->id}")->assertNotFound();
        $this->postJson("/api/v1/inquiries/{$lead->id}/claim")->assertNotFound();
    }

    // ---- processing ----------------------------------------------------

    public function test_first_telecaller_claims_and_a_second_is_blocked(): void
    {
        $this->submit()->assertCreated();
        $id = LoanLead::query()->value('id');
        $one = $this->user(UserRole::Telecaller);
        $two = $this->user(UserRole::Telecaller);

        Sanctum::actingAs($one);
        $this->postJson("/api/v1/inquiries/{$id}/activities", ['type' => 'contact', 'body' => 'Called, interested'])->assertCreated();
        $this->assertSame($one->id, LoanLead::query()->value('assigned_telecaller_id'));
        $this->assertSame('contacted', LoanLead::query()->value('inquiry_status'));

        Sanctum::actingAs($two);
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'interested'])->assertStatus(409);
        $this->postJson("/api/v1/inquiries/{$id}/claim")->assertStatus(409);

        Sanctum::actingAs($this->user(UserRole::SuperAdmin));
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'interested'])->assertOk();
    }

    public function test_status_update_rules(): void
    {
        $this->submit()->assertCreated();
        $id = LoanLead::query()->value('id');
        Sanctum::actingAs($this->user(UserRole::Telecaller));

        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'assigned'])->assertStatus(422);   // not manually settable
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'bogus'])->assertStatus(422);
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'follow_up'])->assertStatus(422); // needs a date

        $when = now()->addDay()->toIso8601String();
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'follow_up', 'next_follow_up_at' => $when])->assertOk();
        $this->assertNotNull(LoanLead::query()->value('next_follow_up_at'));
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'follow_up', 'next_follow_up_at' => now()->subDay()->toIso8601String()])->assertStatus(422);
    }

    // ---- assignment ----------------------------------------------------

    private function assignable(): array
    {
        $this->submit()->assertCreated();
        $lead = LoanLead::query()->firstOrFail();
        $m1 = $this->user(UserRole::Manager, ['name' => 'Mgr One']);
        $m2 = $this->user(UserRole::Manager, ['name' => 'Mgr Two']);

        return [$lead, $m1, $m2];
    }

    public function test_telecaller_assigns_to_manager_atomically_with_history_and_notifications(): void
    {
        [$lead, $m1] = $this->assignable();
        $tele = $this->user(UserRole::Telecaller);

        Sanctum::actingAs($tele);
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m1->id, 'reason' => 'Home loan expert'])->assertOk();

        $lead->refresh();
        $this->assertSame($m1->id, $lead->assigned_manager_id);
        $this->assertSame(LeadStatus::Assigned, $lead->status);
        $this->assertSame('assigned', $lead->inquiry_status);
        $this->assertSame($tele->id, $lead->assigned_telecaller_id);
        $this->assertDatabaseHas('lead_assignments', ['loan_lead_id' => $lead->id, 'assigned_to' => $m1->id, 'assigned_by' => $tele->id, 'status' => 'active', 'remarks' => 'Home loan expert']);
        $this->assertDatabaseHas('lead_status_history', ['loan_lead_id' => $lead->id, 'to_status' => 'assigned', 'changed_by' => $tele->id]);
        $this->assertDatabaseHas('notifications', ['user_id' => $m1->id, 'type' => 'lead.assigned']);
        $this->assertDatabaseHas('audit_logs', ['entity_label' => $lead->reference, 'category' => 'lead_assignment']);

        // The Manager now sees it through the existing lead workflow...
        Sanctum::actingAs($m1);
        $this->getJson('/api/v1/leads')->assertOk()->assertJsonCount(1, 'data');
        // ...but a different manager still does not.
        Sanctum::actingAs($this->user(UserRole::Manager));
        $this->getJson('/api/v1/leads')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_telecaller_cannot_reassign_but_super_admin_can_with_a_reason(): void
    {
        [$lead, $m1, $m2] = $this->assignable();
        $tele = $this->user(UserRole::Telecaller);
        Sanctum::actingAs($tele);
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m1->id])->assertOk();
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m2->id])->assertStatus(409);

        Sanctum::actingAs($this->user(UserRole::SuperAdmin));
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m2->id])->assertStatus(422); // reason required
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m2->id, 'reason' => 'Workload'])->assertOk();

        $this->assertSame($m2->id, $lead->refresh()->assigned_manager_id);
        $this->assertSame(1, LeadAssignment::query()->where('loan_lead_id', $lead->id)->where('status', 'active')->count());
        $this->assertSame(1, LeadAssignment::query()->where('loan_lead_id', $lead->id)->where('status', 'released')->count());
        $detail = $this->getJson("/api/v1/inquiries/{$lead->id}")->assertOk();
        $this->assertCount(2, $detail->json('data.assignments'));
    }

    public function test_assignment_rejects_non_managers_and_inactive_managers(): void
    {
        [$lead] = $this->assignable();
        Sanctum::actingAs($this->user(UserRole::Telecaller));

        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $this->user(UserRole::Banker)->id])->assertStatus(422);
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $this->user(UserRole::RelationshipManager)->id])->assertStatus(422);
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $this->user(UserRole::Manager, ['is_active' => false])->id])->assertStatus(422);
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => 99999])->assertStatus(422);
        $this->assertNull($lead->refresh()->assigned_manager_id);
    }

    public function test_routing_rules_restrict_telecallers_but_not_super_admin(): void
    {
        [$lead, $m1, $m2] = $this->assignable();
        $admin = $this->user(UserRole::SuperAdmin);

        Sanctum::actingAs($this->user(UserRole::Telecaller));
        $this->putJson('/api/v1/inquiries/routing-rules/home_loan', ['manager_ids' => [$m1->id]])->assertForbidden();

        Sanctum::actingAs($admin);
        $this->putJson('/api/v1/inquiries/routing-rules/home_loan', ['manager_ids' => [$m1->id]])->assertOk();
        $this->assertSame(1, InquiryRoutingRule::query()->where('department', 'home_loan')->count());
        $this->putJson('/api/v1/inquiries/routing-rules/home_loan', ['manager_ids' => [$this->user(UserRole::Banker)->id]])->assertStatus(422);
        $this->putJson('/api/v1/inquiries/routing-rules/not_a_dept', ['manager_ids' => []])->assertStatus(422);

        $tele = $this->user(UserRole::Telecaller);
        Sanctum::actingAs($tele);
        $options = $this->getJson("/api/v1/inquiries/{$lead->id}/managers")->assertOk()->json('data');
        $this->assertSame([$m1->id], array_column($options, 'id'));
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m2->id])->assertStatus(422);
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m1->id])->assertOk();
    }

    public function test_assigned_inquiry_is_locked_for_status_changes(): void
    {
        [$lead, $m1] = $this->assignable();
        Sanctum::actingAs($this->user(UserRole::Telecaller));
        $this->postJson("/api/v1/inquiries/{$lead->id}/assign", ['manager_id' => $m1->id])->assertOk();

        $this->putJson("/api/v1/inquiries/{$lead->id}/status", ['inquiry_status' => 'not_interested'])->assertStatus(409);
    }

    public function test_detail_warns_about_other_leads_with_the_same_phone_without_merging(): void
    {
        $this->submit()->assertCreated();
        $this->submit(['product' => 'personal-loan'])->assertCreated();
        $id = LoanLead::query()->where('loan_type', 'home')->value('id');

        Sanctum::actingAs($this->user(UserRole::SuperAdmin));
        $this->getJson("/api/v1/inquiries/{$id}")->assertOk()->assertJsonCount(1, 'data.possible_duplicates');
        $this->assertSame(2, LoanLead::query()->count());
    }
}
