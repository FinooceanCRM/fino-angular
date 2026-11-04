<?php

namespace Tests\Feature\Telecaller;

use App\Enums\UserRole;
use App\Models\ContactMessage;
use App\Models\CustomerBankAccount;
use App\Models\CustomerKycDocument;
use App\Models\Document;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Everything a customer submits that a person has to check lands on the Telecaller verification desk:
 * application documents, KYC files, bank accounts, website messages and (already) the inquiries themselves.
 */
class TelecallerVerificationDeskTest extends TestCase
{
    use RefreshDatabase;

    private function telecaller(): User
    {
        return User::factory()->create(['role' => UserRole::Telecaller, 'is_active' => true]);
    }

    private function customer(string $email = 'c1@example.test'): User
    {
        $this->postJson('/api/v1/customer/auth/register', [
            'name' => 'Rohan Sharma', 'email' => $email, 'phone' => '9876543210',
            'password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh', 'terms' => true,
        ])->assertCreated();

        return User::query()->where('email', $email)->firstOrFail();
    }

    private function pdf(): UploadedFile
    {
        return UploadedFile::fake()->create('doc.pdf', 50, 'application/pdf');
    }

    /** A customer applies from the portal and returns the new lead id. */
    private function apply(): int
    {
        return (int) $this->postJson('/api/v1/customer/applications', [
            'product' => 'personal-loan', 'loan_amount' => 500000, 'tenure_months' => 36, 'monthly_income' => 75000,
            'city' => 'Nagpur', 'applicant_phone' => '9876543210', 'consent' => true, 'employment_type' => 'salaried',
        ])->assertCreated()->json('data.id');
    }

    public function test_the_desk_is_for_telecallers_and_super_admins_only(): void
    {
        $urls = ['summary', 'documents', 'kyc', 'bank-accounts', 'messages'];
        foreach ($urls as $u) {
            $this->getJson("/api/v1/telecallers/verification/$u")->assertUnauthorized();
        }
        foreach (['employee', 'manager', 'relationship_manager', 'banker'] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role, 'is_active' => true]));
            foreach ($urls as $u) {
                $this->getJson("/api/v1/telecallers/verification/$u")->assertForbidden();
            }
        }
        Sanctum::actingAs($this->customer());
        $this->getJson('/api/v1/telecallers/verification/summary')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::SuperAdmin, 'is_active' => true]));
        $this->getJson('/api/v1/telecallers/verification/summary')->assertOk();
    }

    public function test_everything_a_customer_submits_reaches_the_desk_and_the_dashboard_counts_it(): void
    {
        Storage::fake('local');
        $tele = $this->telecaller();
        $customer = $this->customer();
        Sanctum::actingAs($customer);

        $lead = $this->apply();
        $this->postJson("/api/v1/customer/applications/$lead/documents", ['document_type' => 'pan', 'file' => $this->pdf()])->assertCreated();
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf(), 'number' => 'ABCDE1234F'])->assertCreated();
        $this->postJson('/api/v1/customer/bank-accounts', [
            'holder_name' => 'Rohan Sharma', 'bank_name' => 'HDFC Bank', 'account_number' => '123456789012',
            'account_number_confirmation' => '123456789012', 'ifsc' => 'HDFC0001234', 'account_type' => 'savings', 'confirm' => true,
        ])->assertCreated();

        // a visitor's website message needs no account
        app('auth')->forgetGuards();
        $this->postJson('/api/v1/public/contact', [
            'name' => 'Visitor', 'email' => 'v@example.test', 'phone' => '9811111111', 'inquiry_type' => 'Other',
            'message' => 'Please call me about a loan', 'consent' => true,
        ])->assertCreated();

        Sanctum::actingAs($tele);
        $s = $this->getJson('/api/v1/telecallers/verification/summary')->assertOk()->json('data');
        $this->assertSame(['new_inquiries' => 1, 'documents' => 1, 'kyc' => 1, 'bank_accounts' => 1, 'messages' => 1], $s);

        // the telecaller dashboard carries the same counts
        $this->assertSame($s, $this->getJson('/api/v1/telecallers/dashboard')->assertOk()->json('data.verification'));

        // and she was told about each one as it arrived
        $types = Notification::query()->where('user_id', $tele->id)->pluck('type')->all();
        foreach (['inquiry.new', 'document.uploaded', 'kyc.uploaded', 'bank.added', 'contact.message'] as $t) {
            $this->assertContains($t, $types, "telecaller should be notified of $t");
        }

        $doc = $this->getJson('/api/v1/telecallers/verification/documents')->json('data.0');
        $this->assertSame('pan', $doc['type']);
        $this->assertSame($lead, $doc['lead']['id']);
        $this->assertStringStartsWith('INQ-', $doc['lead']['reference']);
        $this->assertSame('Rohan Sharma', $this->getJson('/api/v1/telecallers/verification/kyc')->json('data.0.customer.name'));
        $this->assertSame('XXXXXX9012', $this->getJson('/api/v1/telecallers/verification/bank-accounts')->json('data.0.account_masked'));
        $this->assertStringNotContainsString('123456789012', $this->getJson('/api/v1/telecallers/verification/bank-accounts')->getContent());
    }

    public function test_verifying_and_rejecting_documents_updates_the_customer(): void
    {
        Storage::fake('local');
        $tele = $this->telecaller();
        $customer = $this->customer();
        Sanctum::actingAs($customer);
        $lead = $this->apply();
        $this->postJson("/api/v1/customer/applications/$lead/documents", ['document_type' => 'pan', 'file' => $this->pdf()])->assertCreated();
        $this->postJson("/api/v1/customer/applications/$lead/documents", ['document_type' => 'aadhaar', 'file' => $this->pdf()])->assertCreated();
        [$pan, $aadhaar] = Document::query()->orderBy('id')->pluck('id')->all();

        Sanctum::actingAs($tele);
        $this->postJson("/api/v1/telecallers/verification/documents/$pan/verify")->assertOk();
        $this->postJson("/api/v1/telecallers/verification/documents/$aadhaar/reject")->assertStatus(422); // a reason is required
        $this->postJson("/api/v1/telecallers/verification/documents/$aadhaar/reject", ['reason' => 'Photo is blurred'])->assertOk();

        $this->assertSame('verified', Document::find($pan)->status);
        $this->assertSame('rejected', Document::find($aadhaar)->status);
        $this->assertSame('Photo is blurred', Document::find($aadhaar)->remarks);
        $this->assertSame([], $this->getJson('/api/v1/telecallers/verification/documents')->json('data'));
        $this->assertSame(2, Notification::query()->where('user_id', $customer->id)->whereIn('type', ['document.verified', 'document.rejected'])->count());

        // once decided it cannot be decided again from the desk
        $this->postJson("/api/v1/telecallers/verification/documents/$pan/verify")->assertNotFound();
    }

    public function test_kyc_review_is_visible_to_the_customer_on_their_profile(): void
    {
        Storage::fake('local');
        $tele = $this->telecaller();
        $customer = $this->customer();
        Sanctum::actingAs($customer);
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf(), 'number' => 'ABCDE1234F'])->assertCreated();
        $this->postJson('/api/v1/customer/kyc/address_proof', ['file' => $this->pdf()])->assertCreated();
        [$pan, $addr] = CustomerKycDocument::query()->orderBy('id')->pluck('id')->all();

        Sanctum::actingAs($tele);
        $this->get("/api/v1/telecallers/verification/kyc/$pan/download")->assertOk();
        $this->postJson("/api/v1/telecallers/verification/kyc/$pan/verify")->assertOk();
        $this->postJson("/api/v1/telecallers/verification/kyc/$addr/reject", ['reason' => 'Address not readable'])->assertOk();

        Sanctum::actingAs($customer);
        $types = collect($this->getJson('/api/v1/customer/profile')->json('data.kyc.types'))->keyBy('type');
        $this->assertSame('verified', $types['pan']['status']);
        $this->assertSame('rejected', $types['address_proof']['status']);
        $this->assertSame('Address not readable', $types['address_proof']['document']['remarks']);
        $this->assertSame(2, Notification::query()->where('user_id', $customer->id)->whereIn('type', ['kyc.verified', 'kyc.rejected'])->count());
    }

    public function test_bank_accounts_and_website_messages_can_be_cleared_from_the_desk(): void
    {
        $tele = $this->telecaller();
        $customer = $this->customer();
        Sanctum::actingAs($customer);
        $this->postJson('/api/v1/customer/bank-accounts', [
            'holder_name' => 'Rohan Sharma', 'bank_name' => 'HDFC Bank', 'account_number' => '123456789012',
            'account_number_confirmation' => '123456789012', 'ifsc' => 'HDFC0001234', 'account_type' => 'savings', 'confirm' => true,
        ])->assertCreated();
        $message = ContactMessage::query()->create(['name' => 'V', 'email' => 'v@example.test', 'phone' => '9811111111', 'inquiry_type' => 'Other', 'message' => 'Call me please']);

        Sanctum::actingAs($tele);
        $bank = CustomerBankAccount::query()->firstOrFail();
        $this->postJson("/api/v1/telecallers/verification/bank-accounts/{$bank->id}/verify")->assertOk();
        $this->postJson("/api/v1/telecallers/verification/messages/{$message->id}/handled")->assertOk();

        $this->assertSame('verified', $bank->refresh()->status);
        $this->assertNotNull($message->refresh()->handled_at);
        $this->assertSame(0, $this->getJson('/api/v1/telecallers/verification/summary')->json('data.bank_accounts'));
        $this->assertSame(0, $this->getJson('/api/v1/telecallers/verification/summary')->json('data.messages'));
    }

    public function test_documents_on_internal_leads_are_not_part_of_the_customer_desk(): void
    {
        Storage::fake('local');
        $tele = $this->telecaller();
        $lead = \App\Models\LoanLead::factory()->create(['source' => 'internal']);
        Document::query()->create([
            'loan_lead_id' => $lead->id, 'uploaded_by' => $tele->id, 'document_type' => 'pan', 'original_name' => 'x.pdf',
            'path' => 'x', 'mime_type' => 'application/pdf', 'size_bytes' => 10, 'status' => 'pending',
        ]);

        Sanctum::actingAs($tele);
        $this->assertSame(0, $this->getJson('/api/v1/telecallers/verification/summary')->json('data.documents'));
    }
}
