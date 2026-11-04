<?php

namespace Tests\Feature\Portal;

use App\Enums\LeadStatus;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Every customer documents endpoint: auth fences, validation, replace rules, listing and download. */
class CustomerDocumentsApiTest extends TestCase
{
    use RefreshDatabase;

    private function customer(string $email = 'c1@example.test'): User
    {
        $this->postJson('/api/v1/customer/auth/register', [
            'name' => 'Rohan Sharma', 'email' => $email, 'phone' => '9876543210',
            'password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh', 'terms' => true,
        ])->assertCreated();

        return User::query()->where('email', $email)->firstOrFail();
    }

    private function applyAs(User $user): int
    {
        Sanctum::actingAs($user);
        $res = $this->postJson('/api/v1/customer/applications', [
            'product' => 'personal-loan', 'loan_amount' => 300000, 'tenure_months' => 36,
            'monthly_income' => 60000, 'city' => 'Nagpur', 'consent' => true,
        ]);
        $res->assertCreated();

        return (int) $res->json('data.id');
    }

    /** A real file on disk (so the server's content sniffing runs), declared as $declaredMime by the client. */
    private function realFile(string $name, string $bytes, string $declaredMime): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'fino');
        file_put_contents($path, $bytes);

        return new UploadedFile($path, $name, $declaredMime, null, true);
    }

    private function upload(int $leadId, string $type, ?UploadedFile $file = null)
    {
        return $this->postJson("/api/v1/customer/applications/{$leadId}/documents", array_filter([
            'document_type' => $type,
            'file' => $file ?? UploadedFile::fake()->create('doc.pdf', 50, 'application/pdf'),
        ], static fn ($v) => $v !== null));
    }

    // ── auth fences ────────────────────────────────────────────────────────────

    public function test_documents_list_requires_login(): void
    {
        $this->getJson('/api/v1/customer/documents')->assertUnauthorized();
    }

    public function test_upload_requires_login(): void
    {
        $this->postJson('/api/v1/customer/applications/1/documents', [])->assertUnauthorized();
    }

    public function test_download_requires_login(): void
    {
        $this->getJson('/api/v1/customer/documents/1/download')->assertUnauthorized();
    }

    public function test_staff_token_cannot_use_customer_documents(): void
    {
        $staff = User::factory()->create(['role' => 'employee']);
        Sanctum::actingAs($staff);
        $this->getJson('/api/v1/customer/documents')->assertForbidden();
    }

    // ── listing ────────────────────────────────────────────────────────────────

    public function test_new_customer_has_no_documents(): void
    {
        Sanctum::actingAs($this->customer());
        $this->getJson('/api/v1/customer/documents')->assertOk()->assertJsonPath('data', []);
    }

    public function test_list_returns_label_status_and_reference_for_each_upload(): void
    {
        Storage::fake('local');
        $user = $this->customer();
        $lead = $this->applyAs($user);
        $this->upload($lead, 'pan')->assertCreated();

        $row = $this->getJson('/api/v1/customer/documents')->assertOk()->json('data.0');
        $this->assertSame('PAN Card', $row['label']);
        $this->assertSame('pending', $row['status']);
        $this->assertSame('doc.pdf', $row['file_name']);
        $this->assertNotEmpty($row['reference']);
        $this->assertSame($lead, $row['lead_id']);
    }

    public function test_list_only_contains_the_callers_documents(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $leadA = $this->applyAs($a);
        $this->upload($leadA, 'pan')->assertCreated();

        Sanctum::actingAs($b);
        $this->getJson('/api/v1/customer/documents')->assertOk()->assertJsonPath('data', []);
    }

    // ── upload: accepted ───────────────────────────────────────────────────────

    public function test_pdf_jpg_and_png_are_accepted(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());

        $this->upload($lead, 'aadhaar', UploadedFile::fake()->create('a.pdf', 100, 'application/pdf'))->assertCreated();
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        $jpg = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=');
        $this->upload($lead, 'pan', $this->realFile('p.jpg', $jpg, 'image/jpeg'))->assertCreated();
        $this->upload($lead, 'income_proof', $this->realFile('i.png', $png, 'image/png'))->assertCreated();
        $this->assertSame(3, Document::query()->count());
    }

    public function test_a_file_of_exactly_5mb_is_accepted(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan', UploadedFile::fake()->create('five.pdf', 5120, 'application/pdf'))->assertCreated();
    }

    public function test_optional_document_types_are_accepted(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());

        foreach (['address_proof', 'property_documents', 'other'] as $type) {
            $this->upload($lead, $type)->assertCreated();
        }
        $this->assertSame(3, Document::query()->count());
    }

    // ── upload: rejected ───────────────────────────────────────────────────────

    public function test_file_over_5mb_is_rejected(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan', UploadedFile::fake()->create('big.pdf', 5121, 'application/pdf'))->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_executable_and_text_files_are_rejected(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan', UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload'))->assertStatus(422);
        $this->upload($lead, 'pan', UploadedFile::fake()->create('notes.txt', 10, 'text/plain'))->assertStatus(422);
        $this->upload($lead, 'pan', UploadedFile::fake()->create('sheet.docx', 10, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))->assertStatus(422);
    }

    public function test_a_renamed_file_with_the_wrong_real_type_is_rejected(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        // Named .pdf, but the bytes are plain text: the sniffed MIME must also match.
        $fake = $this->realFile('pan.pdf', 'this is not a pdf, just plain text', 'application/pdf');
        $this->upload($lead, 'pan', $fake)->assertStatus(422);
        $this->assertSame(0, Document::query()->count());
    }

    public function test_missing_file_is_rejected(): void
    {
        $lead = $this->applyAs($this->customer());
        $this->postJson("/api/v1/customer/applications/{$lead}/documents", ['document_type' => 'pan'])
            ->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_missing_document_type_is_rejected(): void
    {
        $lead = $this->applyAs($this->customer());
        $this->postJson("/api/v1/customer/applications/{$lead}/documents", ['file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])
            ->assertStatus(422)->assertJsonValidationErrors('document_type');
    }

    public function test_unknown_document_type_is_rejected(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'passport_photo_of_my_dog')->assertStatus(422);
    }

    public function test_cannot_upload_to_another_customers_application(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $leadA = $this->applyAs($a);

        Sanctum::actingAs($b);
        $this->upload($leadA, 'pan')->assertNotFound();
    }

    public function test_cannot_upload_to_a_missing_application(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->customer());
        $this->upload(999999, 'pan')->assertNotFound();
    }

    public function test_closed_application_no_longer_accepts_documents(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        LoanLead::query()->whereKey($lead)->update(['status' => LeadStatus::Closed->value]);
        $this->upload($lead, 'pan')->assertStatus(422);
    }

    // ── replace rules ──────────────────────────────────────────────────────────

    public function test_re_uploading_a_pending_document_replaces_it(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan', UploadedFile::fake()->create('first.pdf', 10, 'application/pdf'))->assertCreated();
        $this->upload($lead, 'pan', UploadedFile::fake()->create('second.pdf', 10, 'application/pdf'))->assertCreated();

        $rows = $this->getJson('/api/v1/customer/documents')->assertOk()->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame('second.pdf', $rows[0]['file_name']);
    }

    public function test_verified_document_cannot_be_replaced(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan')->assertCreated();
        Document::query()->update(['status' => 'verified']);
        $this->upload($lead, 'pan')->assertStatus(422);
    }

    public function test_rejected_document_shows_the_reason_and_can_be_re_uploaded(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan')->assertCreated();
        Document::query()->update(['status' => 'rejected', 'remarks' => 'Image is blurry']);

        $row = $this->getJson('/api/v1/customer/documents')->json('data.0');
        $this->assertSame('rejected', $row['status']);
        $this->assertSame('Image is blurry', $row['remarks']);

        $this->upload($lead, 'pan')->assertCreated();
        $this->assertSame('pending', $this->getJson('/api/v1/customer/documents')->json('data.0.status'));
    }

    // ── checklist on the application ───────────────────────────────────────────

    public function test_application_checklist_lists_required_and_optional_documents(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        $this->upload($lead, 'pan')->assertCreated();

        $docs = collect($this->getJson("/api/v1/customer/applications/{$lead}")->assertOk()->json('data.documents'));
        $this->assertCount(7, $docs);
        $this->assertSame(['aadhaar', 'pan', 'income_proof', 'bank_statement'], $docs->where('required', true)->pluck('type')->values()->all());
        $this->assertSame(['address_proof', 'property_documents', 'other'], $docs->where('required', false)->pluck('type')->values()->all());
        $this->assertSame('pending', $docs->firstWhere('type', 'pan')['status']);
        $this->assertSame('not_uploaded', $docs->firstWhere('type', 'aadhaar')['status']);
    }

    public function test_dashboard_missing_documents_only_counts_required_ones(): void
    {
        Storage::fake('local');
        $lead = $this->applyAs($this->customer());
        LoanLead::query()->whereKey($lead)->update(['status' => LeadStatus::DocumentsPending->value]);
        $this->upload($lead, 'pan')->assertCreated();

        $missing = $this->getJson('/api/v1/customer/dashboard')->assertOk()->json('data.pending_actions.0.missing_documents');
        $this->assertEqualsCanonicalizing(['Aadhaar Card', 'Income Proof', 'Bank Statement'], $missing);
    }

    // ── download ───────────────────────────────────────────────────────────────

    public function test_owner_can_download_and_others_cannot(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $lead = $this->applyAs($a);
        $this->upload($lead, 'pan')->assertCreated();
        $doc = Document::query()->firstOrFail();

        Sanctum::actingAs($a);
        $this->get("/api/v1/customer/documents/{$doc->id}/download")->assertOk();

        Sanctum::actingAs($b);
        $this->getJson("/api/v1/customer/documents/{$doc->id}/download")->assertNotFound();
    }

    public function test_download_of_a_missing_document_is_not_found(): void
    {
        Sanctum::actingAs($this->customer());
        $this->getJson('/api/v1/customer/documents/999999/download')->assertNotFound();
    }
}
