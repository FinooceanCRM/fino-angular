<?php

namespace Tests\Feature\Portal;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerPortalTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function registration(array $o = []): array
    {
        return array_merge([
            'name' => 'Rohan Sharma',
            'email' => 'rohan@example.test',
            'phone' => '9876543210',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
            'terms' => true,
        ], $o);
    }

    private function customer(string $email = 'c1@example.test'): User
    {
        $res = $this->postJson('/api/v1/customer/auth/register', $this->registration(['email' => $email]));
        $res->assertCreated();

        return User::query()->where('email', $email)->firstOrFail();
    }

    private function applyAs(User $user, array $o = []): int
    {
        Sanctum::actingAs($user);
        $res = $this->postJson('/api/v1/customer/applications', array_merge([
            'product' => 'personal-loan',
            'loan_amount' => 300000,
            'tenure_months' => 36,
            'monthly_income' => 60000,
            'city' => 'Nagpur',
            'consent' => true,
        ], $o));
        $res->assertCreated();

        return (int) $res->json('data.id');
    }

    public function test_registration_creates_customer_role_user_and_linked_customer_row(): void
    {
        $res = $this->postJson('/api/v1/customer/auth/register', $this->registration());

        $res->assertCreated()->assertJsonPath('data.user.role', 'customer');
        $user = User::query()->where('email', 'rohan@example.test')->firstOrFail();
        $this->assertSame(UserRole::Customer, $user->roleEnum());
        $this->assertTrue(Customer::query()->where('user_id', $user->id)->exists());
    }

    public function test_registration_validates_input(): void
    {
        $this->postJson('/api/v1/customer/auth/register', $this->registration(['password' => 'short', 'password_confirmation' => 'short']))
            ->assertStatus(422);
        $this->customer();
        $this->postJson('/api/v1/customer/auth/register', $this->registration(['email' => 'c1@example.test']))->assertStatus(422); // duplicate email
    }

    public function test_single_login_signs_in_customers_but_their_token_cannot_reach_the_crm(): void
    {
        $this->customer();

        $res = $this->postJson('/api/v1/auth/login', ['email' => 'c1@example.test', 'password' => 'Secret123'])
            ->assertOk()->assertJsonPath('data.user.role', 'customer');

        $this->withHeader('Authorization', 'Bearer '.$res->json('data.token'))
            ->getJson('/api/v1/leads')->assertForbidden();
    }

    public function test_customer_door_login_still_works(): void
    {
        $this->customer();

        $this->postJson('/api/v1/customer/auth/login', ['email' => 'c1@example.test', 'password' => 'Secret123'])
            ->assertOk()->assertJsonStructure(['data' => ['token']]);
    }

    public function test_customer_door_refuses_staff_accounts(): void
    {
        User::factory()->role(UserRole::Manager)->create(['email' => 'm@example.test', 'password' => 'Secret123']);

        $this->postJson('/api/v1/customer/auth/login', ['email' => 'm@example.test', 'password' => 'Secret123'])
            ->assertStatus(422);
    }

    public function test_customer_is_fenced_out_of_crm_routes(): void
    {
        Sanctum::actingAs($this->customer());

        foreach (['leads', 'users', 'search?q=a', 'notifications', 'inquiries', 'customers', 'banks', 'tasks'] as $path) {
            $this->getJson('/api/v1/'.$path)->assertForbidden();
        }
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.role', 'customer');
    }

    public function test_staff_cannot_use_customer_endpoints(): void
    {
        foreach ([UserRole::SuperAdmin, UserRole::Manager, UserRole::Telecaller, UserRole::Banker] as $role) {
            Sanctum::actingAs(User::factory()->role($role)->create());
            $this->getJson('/api/v1/customer/dashboard')->assertForbidden();
            $this->getJson('/api/v1/customer/applications')->assertForbidden();
        }
    }

    public function test_user_management_forms_cannot_create_customer_role(): void
    {
        Sanctum::actingAs(User::factory()->role(UserRole::SuperAdmin)->create());

        $this->postJson('/api/v1/users', [
            'name' => 'X', 'email' => 'x@example.test', 'password' => 'Secret123', 'role' => 'customer',
        ])->assertStatus(422);
    }

    public function test_portal_application_is_linked_to_the_customer_and_visible_in_their_list(): void
    {
        $user = $this->customer();
        $id = $this->applyAs($user);

        $lead = LoanLead::query()->findOrFail($id);
        $this->assertSame('customer_portal', $lead->source);
        $this->assertSame('new', $lead->inquiry_status);
        $this->assertSame(Customer::query()->where('user_id', $user->id)->value('id'), $lead->customer_id);

        $this->getJson('/api/v1/customer/applications')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status.label', 'Inquiry Received');
    }

    public function test_customer_cannot_read_another_customers_application(): void
    {
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $aLead = $this->applyAs($a);

        Sanctum::actingAs($b);
        $this->getJson("/api/v1/customer/applications/{$aLead}")->assertNotFound();
        $this->getJson('/api/v1/customer/applications')->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("/api/v1/customer/applications/{$aLead}/documents", [
            'document_type' => 'pan', 'file' => UploadedFile::fake()->create('pan.pdf', 50, 'application/pdf'),
        ])->assertNotFound();
    }

    public function test_application_view_never_leaks_internal_fields(): void
    {
        $user = $this->customer();
        $id = $this->applyAs($user);
        LoanLead::query()->whereKey($id)->update(['notes' => 'INTERNAL-SECRET', 'status' => LeadStatus::InProgress->value]);

        $json = $this->getJson("/api/v1/customer/applications/{$id}")->assertOk();
        $body = json_encode($json->json());

        $this->assertStringNotContainsString('INTERNAL-SECRET', $body);
        $this->assertStringNotContainsString('in_progress', $body);
        foreach (['assigned_manager', 'assigned_telecaller', 'inquiry_status', 'pd_details', 'credit_score'] as $key) {
            $this->assertStringNotContainsString($key, $body);
        }
        $json->assertJsonPath('data.status.label', 'Processing');
    }

    public function test_document_upload_validates_stores_privately_and_is_owner_only_downloadable(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $leadId = $this->applyAs($a);

        Sanctum::actingAs($a);
        $this->postJson("/api/v1/customer/applications/{$leadId}/documents", [
            'document_type' => 'pan', 'file' => UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload'),
        ])->assertStatus(422);
        $this->postJson("/api/v1/customer/applications/{$leadId}/documents", [
            'document_type' => 'pan', 'file' => UploadedFile::fake()->create('big.pdf', 6000, 'application/pdf'),
        ])->assertStatus(422);
        $this->postJson("/api/v1/customer/applications/{$leadId}/documents", [
            'document_type' => 'not_a_type', 'file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'),
        ])->assertStatus(422);

        $this->postJson("/api/v1/customer/applications/{$leadId}/documents", [
            'document_type' => 'pan', 'file' => UploadedFile::fake()->create('pan.pdf', 50, 'application/pdf'),
        ])->assertCreated();

        $doc = Document::query()->firstOrFail();
        Storage::disk('local')->assertExists($doc->path);
        $this->getJson("/api/v1/customer/documents/{$doc->id}/download")->assertOk();

        Sanctum::actingAs($b);
        $this->getJson("/api/v1/customer/documents/{$doc->id}/download")->assertNotFound();
    }

    public function test_verified_document_cannot_be_replaced_by_the_customer(): void
    {
        Storage::fake('local');
        $user = $this->customer();
        $leadId = $this->applyAs($user);
        $this->postJson("/api/v1/customer/applications/{$leadId}/documents", [
            'document_type' => 'pan', 'file' => UploadedFile::fake()->create('pan.pdf', 50, 'application/pdf'),
        ])->assertCreated();
        Document::query()->update(['status' => 'verified']);

        $this->postJson("/api/v1/customer/applications/{$leadId}/documents", [
            'document_type' => 'pan', 'file' => UploadedFile::fake()->create('pan2.pdf', 50, 'application/pdf'),
        ])->assertStatus(422);
    }

    public function test_status_change_by_staff_notifies_customer_with_mapped_wording(): void
    {
        $user = $this->customer();
        $id = $this->applyAs($user);

        $manager = User::factory()->role(UserRole::Manager)->create();
        Sanctum::actingAs($manager);
        LoanLead::query()->whereKey($id)->update(['assigned_manager_id' => $manager->id]);
        $this->postJson("/api/v1/leads/{$id}/status", ['status' => 'documents_pending'])->assertOk();

        Sanctum::actingAs($user);
        $res = $this->getJson('/api/v1/customer/notifications')->assertOk();
        $titles = collect($res->json('data'))->pluck('title')->all();
        $this->assertContains('Application update: Documents Required', $titles);
    }

    public function test_customer_cannot_set_internal_status_or_assign(): void
    {
        $user = $this->customer();
        $id = $this->applyAs($user);

        $this->postJson("/api/v1/leads/{$id}/status", ['status' => 'approved'])->assertForbidden();
        $this->postJson("/api/v1/leads/{$id}/assign", ['assignee_id' => $user->id])->assertForbidden();
    }

    public function test_profile_update_and_password_change(): void
    {
        $user = $this->customer();
        Sanctum::actingAs($user);

        $this->putJson('/api/v1/customer/profile', ['name' => 'New Name', 'phone' => '9123456789'])->assertOk();
        $this->assertSame('New Name', Customer::query()->where('user_id', $user->id)->value('name'));

        $this->postJson('/api/v1/auth/password', [
            'current_password' => 'Secret123', 'password' => 'Better456', 'password_confirmation' => 'Better456',
        ])->assertOk();
    }
}
