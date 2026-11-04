<?php

namespace Tests\Feature\Portal;

use App\Enums\LeadStatus;
use App\Models\CustomerBankAccount;
use App\Models\CustomerKycDocument;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** The customer Profile section: personal, KYC, bank, UPI, communication, security, data request, closing the account. */
class CustomerProfileApiTest extends TestCase
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

    private function as(User $u): User
    {
        Sanctum::actingAs($u);

        return $u;
    }

    private function pdf(string $name = 'doc.pdf', int $kb = 50): UploadedFile
    {
        return UploadedFile::fake()->create($name, $kb, 'application/pdf');
    }

    // ── fences ────────────────────────────────────────────────────────────────

    public function test_every_profile_endpoint_requires_a_signed_in_customer(): void
    {
        foreach ([
            ['getJson', '/api/v1/customer/profile'], ['patchJson', '/api/v1/customer/profile/details'], ['putJson', '/api/v1/customer/profile/addresses'],
            ['getJson', '/api/v1/customer/profile/photo'], ['getJson', '/api/v1/customer/kyc'], ['postJson', '/api/v1/customer/kyc/pan'],
            ['getJson', '/api/v1/customer/bank-accounts'], ['postJson', '/api/v1/customer/bank-accounts'], ['getJson', '/api/v1/customer/upi-ids'],
            ['postJson', '/api/v1/customer/upi-ids'], ['getJson', '/api/v1/customer/communication'], ['putJson', '/api/v1/customer/communication'],
            ['getJson', '/api/v1/customer/security/sessions'], ['getJson', '/api/v1/customer/data-export'],
            ['postJson', '/api/v1/customer/account/deletion-request'], ['postJson', '/api/v1/customer/account/deactivate'],
        ] as [$method, $url]) {
            $this->{$method}($url)->assertUnauthorized();
        }
    }

    public function test_staff_cannot_use_the_customer_profile_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'employee']));
        $this->getJson('/api/v1/customer/profile')->assertForbidden();
        $this->getJson('/api/v1/customer/bank-accounts')->assertForbidden();
        $this->getJson('/api/v1/customer/kyc')->assertForbidden();
    }

    // ── personal details ──────────────────────────────────────────────────────

    public function test_a_new_customer_sees_an_empty_profile_with_their_account_basics(): void
    {
        $this->as($this->customer());
        $d = $this->getJson('/api/v1/customer/profile')->assertOk()->json('data');
        $this->assertSame('Rohan Sharma', $d['name']);
        $this->assertSame('c1@example.test', $d['email']);
        $this->assertMatchesRegularExpression('/^FIN\d{8}$/', $d['customer_id']);
        $this->assertNull($d['dob']);
        $this->assertSame(0, $d['kyc']['percent']);
    }

    public function test_personal_details_can_be_saved_and_read_back(): void
    {
        $this->as($this->customer());
        $this->patchJson('/api/v1/customer/profile/details', ['dob' => '1989-07-12', 'gender' => 'male', 'marital_status' => 'married', 'occupation' => 'Private Employee', 'language' => 'hi'])->assertOk();
        $d = $this->getJson('/api/v1/customer/profile')->json('data');
        $this->assertSame('1989-07-12', $d['dob']);
        $this->assertSame('married', $d['marital_status']);
        $this->assertSame('hi', $d['language']);
    }

    public function test_personal_details_reject_bad_values(): void
    {
        $this->as($this->customer());
        $this->patchJson('/api/v1/customer/profile/details', ['dob' => now()->subYears(17)->toDateString()])->assertStatus(422)->assertJsonValidationErrors('dob');
        $this->patchJson('/api/v1/customer/profile/details', ['gender' => 'robot'])->assertStatus(422);
        $this->patchJson('/api/v1/customer/profile/details', ['marital_status' => 'complicated'])->assertStatus(422);
        $this->patchJson('/api/v1/customer/profile/details', ['language' => 'xx'])->assertStatus(422);
    }

    public function test_the_existing_name_and_phone_update_still_works(): void
    {
        $this->as($this->customer());
        $this->putJson('/api/v1/customer/profile', ['name' => 'Rohan K Sharma', 'phone' => '9123456780'])->assertOk();
        $this->assertSame('Rohan K Sharma', $this->getJson('/api/v1/customer/profile')->json('data.name'));
    }

    public function test_addresses_save_and_permanent_can_follow_current(): void
    {
        $this->as($this->customer());
        $addr = ['line1' => '123, Shanti Nagar, Wardha Road', 'city' => 'Nagpur', 'state' => 'Maharashtra', 'pincode' => '440015'];
        $this->putJson('/api/v1/customer/profile/addresses', ['current_address' => $addr, 'permanent_same_as_current' => true])->assertOk();
        $d = $this->getJson('/api/v1/customer/profile')->json('data');
        $this->assertTrue($d['permanent_same_as_current']);
        $this->assertSame('440015', $d['permanent_address']['pincode']);

        $other = ['line1' => '9 Civil Lines', 'city' => 'Pune', 'state' => 'Maharashtra', 'pincode' => '411001'];
        $this->putJson('/api/v1/customer/profile/addresses', ['current_address' => $addr, 'permanent_same_as_current' => false, 'permanent_address' => $other])->assertOk();
        $this->assertSame('Pune', $this->getJson('/api/v1/customer/profile')->json('data.permanent_address.city'));
    }

    public function test_an_address_needs_a_six_digit_pincode(): void
    {
        $this->as($this->customer());
        $this->putJson('/api/v1/customer/profile/addresses', ['current_address' => ['line1' => 'x', 'city' => 'Nagpur', 'state' => 'MH', 'pincode' => '4400']])
            ->assertStatus(422)->assertJsonValidationErrors('current_address.pincode');
        $this->putJson('/api/v1/customer/profile/addresses', ['current_address' => ['line1' => 'x']])->assertStatus(422);
    }

    // ── photo ─────────────────────────────────────────────────────────────────

    public function test_photo_upload_download_and_removal(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->getJson('/api/v1/customer/profile/photo')->assertNotFound();
        $this->postJson('/api/v1/customer/profile/photo', ['file' => UploadedFile::fake()->create('me.jpg', 100, 'image/jpeg')])->assertOk();
        $this->assertTrue($this->getJson('/api/v1/customer/profile')->json('data.has_photo'));
        $this->get('/api/v1/customer/profile/photo')->assertOk();
        $this->deleteJson('/api/v1/customer/profile/photo')->assertOk();
        $this->assertFalse($this->getJson('/api/v1/customer/profile')->json('data.has_photo'));
    }

    public function test_photo_must_be_a_small_jpg_or_png(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/profile/photo', ['file' => UploadedFile::fake()->create('big.jpg', 2049, 'image/jpeg')])->assertStatus(422);
        $this->postJson('/api/v1/customer/profile/photo', ['file' => UploadedFile::fake()->create('me.gif', 10, 'image/gif')])->assertStatus(422);
        $this->postJson('/api/v1/customer/profile/photo', ['file' => $this->pdf()])->assertStatus(422);
        $this->postJson('/api/v1/customer/profile/photo', [])->assertStatus(422);
    }

    public function test_a_photo_belongs_to_one_customer_only(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $this->as($a);
        $this->postJson('/api/v1/customer/profile/photo', ['file' => UploadedFile::fake()->create('a.png', 10, 'image/png')])->assertOk();
        $this->as($b);
        $this->getJson('/api/v1/customer/profile/photo')->assertNotFound();
    }

    // ── KYC ───────────────────────────────────────────────────────────────────

    public function test_kyc_starts_at_zero_with_five_required_documents(): void
    {
        $this->as($this->customer());
        $k = $this->getJson('/api/v1/customer/kyc')->assertOk()->json('data');
        $this->assertSame(0, $k['percent']);
        $this->assertSame(5, $k['total']);
        $this->assertSame('upload', $k['stage']);
        $this->assertCount(7, $k['types']);
        $this->assertSame(['pan', 'aadhaar', 'address_proof', 'bank_proof', 'selfie'], collect($k['types'])->where('required', true)->pluck('type')->values()->all());
    }

    public function test_a_kyc_document_uploads_as_pending_and_keeps_only_a_masked_aadhaar(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf('pan.pdf'), 'number' => 'abcde1234f'])->assertCreated();
        $this->postJson('/api/v1/customer/kyc/aadhaar', ['file' => $this->pdf('aadhaar.pdf'), 'number' => '1234 5678 9012'])->assertCreated();

        $types = collect($this->getJson('/api/v1/customer/kyc')->json('data.types'))->keyBy('type');
        $this->assertSame('pending', $types['pan']['status']);
        $this->assertSame('ABCDE1234F', $types['pan']['document']['reference']);
        $this->assertSame('XXXX XXXX 9012', $types['aadhaar']['document']['reference']);
        $this->assertStringNotContainsString('123456789012', json_encode(CustomerKycDocument::all()->toArray()));
    }

    public function test_kyc_percentage_follows_the_verified_documents(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        foreach (['pan', 'aadhaar', 'address_proof', 'bank_proof', 'selfie'] as $t) {
            $this->postJson("/api/v1/customer/kyc/$t", ['file' => $this->pdf()])->assertCreated();
        }
        $k = $this->getJson('/api/v1/customer/kyc')->json('data');
        $this->assertSame(0, $k['percent']);
        $this->assertSame('in_review', $k['stage']);

        CustomerKycDocument::query()->whereIn('type', ['pan', 'aadhaar', 'address_proof', 'bank_proof'])->update(['status' => 'verified']);
        $k = $this->getJson('/api/v1/customer/kyc')->json('data');
        $this->assertSame(80, $k['percent']);
        $this->assertFalse($k['complete']);

        CustomerKycDocument::query()->where('type', 'selfie')->update(['status' => 'verified']);
        $k = $this->getJson('/api/v1/customer/kyc')->json('data');
        $this->assertSame(100, $k['percent']);
        $this->assertSame('verified', $k['stage']);
        $this->assertTrue($k['complete']);
    }

    public function test_kyc_rejects_bad_files_numbers_and_types(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => UploadedFile::fake()->create('x.exe', 10, 'application/x-msdownload')])->assertStatus(422);
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf('big.pdf', 5121)])->assertStatus(422);
        $this->postJson('/api/v1/customer/kyc/pan', [])->assertStatus(422);
        $this->postJson('/api/v1/customer/kyc/passport', ['file' => $this->pdf()])->assertStatus(422);
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf(), 'number' => 'NOTAPAN'])->assertStatus(422);
        $this->postJson('/api/v1/customer/kyc/aadhaar', ['file' => $this->pdf(), 'number' => '12345'])->assertStatus(422);
        $this->assertSame(0, CustomerKycDocument::query()->count());
    }

    public function test_re_uploading_replaces_a_pending_document_but_not_a_verified_one(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/kyc/address_proof', ['file' => $this->pdf('first.pdf')])->assertCreated();
        $this->postJson('/api/v1/customer/kyc/address_proof', ['file' => $this->pdf('second.pdf')])->assertCreated();
        $this->assertSame(1, CustomerKycDocument::query()->where('type', 'address_proof')->count());
        $this->assertSame('second.pdf', CustomerKycDocument::query()->where('type', 'address_proof')->value('original_name'));

        CustomerKycDocument::query()->update(['status' => 'verified']);
        $this->postJson('/api/v1/customer/kyc/address_proof', ['file' => $this->pdf()])->assertStatus(422);
    }

    public function test_a_rejected_document_shows_its_reason_and_can_be_replaced(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf()])->assertCreated();
        CustomerKycDocument::query()->update(['status' => 'rejected', 'remarks' => 'Photo is blurry']);
        $pan = collect($this->getJson('/api/v1/customer/kyc')->json('data.types'))->firstWhere('type', 'pan');
        $this->assertSame('Photo is blurry', $pan['document']['remarks']);
        $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf()])->assertCreated();
    }

    public function test_additional_documents_can_be_added_more_than_once(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/kyc/additional', ['file' => $this->pdf('a.pdf')])->assertCreated();
        $this->postJson('/api/v1/customer/kyc/additional', ['file' => $this->pdf('b.pdf')])->assertCreated();
        $this->assertSame(2, CustomerKycDocument::query()->where('type', 'additional')->count());
    }

    public function test_only_the_owner_can_download_a_kyc_document(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $this->as($a);
        $id = $this->postJson('/api/v1/customer/kyc/pan', ['file' => $this->pdf()])->json('data.id');
        $this->get("/api/v1/customer/kyc/documents/{$id}/download")->assertOk();
        $this->as($b);
        $this->getJson("/api/v1/customer/kyc/documents/{$id}/download")->assertNotFound();
        $this->getJson('/api/v1/customer/kyc/documents/999999/download')->assertNotFound();
    }

    // ── bank accounts ─────────────────────────────────────────────────────────

    private function bank(array $o = []): array
    {
        return array_merge([
            'holder_name' => 'Rohan Sharma', 'bank_name' => 'HDFC Bank', 'account_number' => '123456789012',
            'account_number_confirmation' => '123456789012', 'ifsc' => 'HDFC0001234', 'account_type' => 'savings',
            'branch' => 'Sitabuldi, Nagpur', 'confirm' => true,
        ], $o);
    }

    public function test_a_bank_account_is_saved_masked_and_the_first_one_is_primary(): void
    {
        $this->as($this->customer());
        $rows = $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->assertCreated()->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame('XXXX XXXX 9012', $rows[0]['account_masked']);
        $this->assertTrue($rows[0]['is_primary']);
        $this->assertSame('pending', $rows[0]['status']);
        $this->assertStringNotContainsString('123456789012', json_encode($rows));
        $this->assertStringNotContainsString('123456789012', $this->getJson('/api/v1/customer/bank-accounts')->getContent());
    }

    public function test_the_account_number_is_stored_encrypted(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->assertCreated();
        $raw = CustomerBankAccount::query()->firstOrFail()->getRawOriginal('account_number_encrypted');
        $this->assertStringNotContainsString('123456789012', $raw);
        $this->assertSame('9012', CustomerBankAccount::query()->firstOrFail()->account_last4);
    }

    public function test_bank_validation(): void
    {
        $this->as($this->customer());
        $cases = [
            ['account_number' => '12345', 'account_number_confirmation' => '12345'],
            ['account_number' => 'ABCDEFGHIJKL', 'account_number_confirmation' => 'ABCDEFGHIJKL'],
            ['account_number_confirmation' => '999999999999'],
            ['ifsc' => 'HDFC1234567'], ['ifsc' => 'HDF0001234'], ['account_type' => 'joint'], ['holder_name' => ''], ['bank_name' => ''], ['confirm' => false],
        ];
        foreach ($cases as $c) {
            $this->postJson('/api/v1/customer/bank-accounts', $this->bank($c))->assertStatus(422);
        }
        $this->assertSame(0, CustomerBankAccount::query()->count());
    }

    public function test_a_lowercase_ifsc_is_accepted_and_normalised(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank(['ifsc' => 'hdfc0001234']))->assertCreated();
        $this->assertSame('HDFC0001234', CustomerBankAccount::query()->value('ifsc'));
    }

    public function test_the_same_account_cannot_be_saved_twice(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->assertCreated();
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->assertStatus(422);
    }

    public function test_primary_can_be_moved_and_removing_the_primary_promotes_another(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->assertCreated();
        $rows = $this->postJson('/api/v1/customer/bank-accounts', $this->bank(['account_number' => '987654321098', 'account_number_confirmation' => '987654321098', 'bank_name' => 'SBI', 'ifsc' => 'SBIN0001234']))->json('data');
        $this->assertCount(2, $rows);
        $second = collect($rows)->firstWhere('bank_name', 'SBI');
        $this->assertFalse($second['is_primary']);

        $rows = $this->postJson("/api/v1/customer/bank-accounts/{$second['id']}/primary")->assertOk()->json('data');
        $this->assertTrue(collect($rows)->firstWhere('bank_name', 'SBI')['is_primary']);
        $this->assertSame(1, collect($rows)->where('is_primary', true)->count());

        $rows = $this->deleteJson("/api/v1/customer/bank-accounts/{$second['id']}")->assertOk()->json('data');
        $this->assertCount(1, $rows);
        $this->assertTrue($rows[0]['is_primary'], 'the remaining account is promoted');
    }

    public function test_at_most_five_bank_accounts(): void
    {
        $this->as($this->customer());
        for ($i = 0; $i < 5; $i++) {
            $n = (string) (100000000000 + $i);
            $this->postJson('/api/v1/customer/bank-accounts', $this->bank(['account_number' => $n, 'account_number_confirmation' => $n]))->assertCreated();
        }
        $n = '555555555555';
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank(['account_number' => $n, 'account_number_confirmation' => $n]))->assertStatus(422);
    }

    public function test_one_customer_cannot_see_or_change_anothers_bank_account(): void
    {
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $this->as($a);
        $id = $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->json('data.0.id');
        $this->as($b);
        $this->assertSame([], $this->getJson('/api/v1/customer/bank-accounts')->json('data'));
        $this->postJson("/api/v1/customer/bank-accounts/{$id}/primary")->assertNotFound();
        $this->deleteJson("/api/v1/customer/bank-accounts/{$id}")->assertNotFound();
        $this->assertSame(1, CustomerBankAccount::query()->count());
    }

    // ── UPI ───────────────────────────────────────────────────────────────────

    public function test_upi_ids_are_saved_with_the_app_guessed_from_the_handle(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'Rohan.Sharma@okaxis'])->assertCreated();
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'rohan1989@ibl'])->assertCreated();
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'rohan@paytm'])->assertCreated();
        $rows = collect($this->getJson('/api/v1/customer/upi-ids')->json('data'));
        $this->assertSame('rohan.sharma@okaxis', $rows->first()['vpa'], 'stored lower-case');
        $this->assertTrue($rows->first()['is_primary']);
        $this->assertSame(['Google Pay', 'PhonePe', 'Paytm'], $rows->pluck('app')->all());
        $this->assertSame('unverified', $rows->first()['status']);
    }

    public function test_upi_validation_and_duplicates(): void
    {
        $this->as($this->customer());
        foreach (['nohandle', '@upi', 'a@b', 'has space@upi', 'x@@upi', ''] as $bad) {
            $this->postJson('/api/v1/customer/upi-ids', ['vpa' => $bad])->assertStatus(422);
        }
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'rohan@upi'])->assertCreated();
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'ROHAN@upi'])->assertStatus(422);
    }

    public function test_upi_primary_and_delete_rules(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'one@upi'])->assertCreated();
        $rows = $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'two@upi'])->json('data');
        $two = collect($rows)->firstWhere('vpa', 'two@upi');
        $rows = $this->postJson("/api/v1/customer/upi-ids/{$two['id']}/primary")->json('data');
        $this->assertTrue(collect($rows)->firstWhere('vpa', 'two@upi')['is_primary']);
        $rows = $this->deleteJson("/api/v1/customer/upi-ids/{$two['id']}")->json('data');
        $this->assertSame(['one@upi'], collect($rows)->pluck('vpa')->all());
        $this->assertTrue($rows[0]['is_primary']);
    }

    public function test_at_most_eight_upi_ids_and_none_shared_between_customers(): void
    {
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $this->as($a);
        for ($i = 1; $i <= 8; $i++) {
            $this->postJson('/api/v1/customer/upi-ids', ['vpa' => "id{$i}@upi"])->assertCreated();
        }
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'id9@upi'])->assertStatus(422);
        $first = $this->getJson('/api/v1/customer/upi-ids')->json('data.0.id');

        $this->as($b);
        $this->assertSame([], $this->getJson('/api/v1/customer/upi-ids')->json('data'));
        $this->postJson("/api/v1/customer/upi-ids/{$first}/primary")->assertNotFound();
        $this->deleteJson("/api/v1/customer/upi-ids/{$first}")->assertNotFound();
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'id1@upi'])->assertCreated();
    }

    // ── communication preferences ─────────────────────────────────────────────

    public function test_defaults_are_everything_on_except_a_few_marketing_options_and_quiet_hours(): void
    {
        $this->as($this->customer());
        $c = $this->getJson('/api/v1/customer/communication')->assertOk()->json('data');
        $this->assertCount(5, $c['events']);
        $this->assertTrue($c['events']['payment_reminders']['sms']);
        $this->assertTrue($c['marketing']['exclusive_offers']);
        $this->assertFalse($c['marketing']['product_updates']);
        $this->assertFalse($c['quiet_hours']['enabled']);
        $this->assertSame('en', $c['language']);
    }

    public function test_a_single_toggle_changes_only_that_toggle(): void
    {
        $this->as($this->customer());
        $c = $this->putJson('/api/v1/customer/communication', ['events' => ['payment_reminders' => ['sms' => false]]])->assertOk()->json('data');
        $this->assertFalse($c['events']['payment_reminders']['sms']);
        $this->assertTrue($c['events']['payment_reminders']['email']);
        $this->assertTrue($c['events']['account_alerts']['sms']);
        // and it persists
        $this->assertFalse($this->getJson('/api/v1/customer/communication')->json('data.events.payment_reminders.sms'));
    }

    public function test_marketing_language_and_quiet_hours_save(): void
    {
        $this->as($this->customer());
        $c = $this->putJson('/api/v1/customer/communication', [
            'marketing' => ['product_updates' => true, 'exclusive_offers' => false], 'language' => 'mr',
            'quiet_hours' => ['enabled' => true, 'start' => '23:00', 'end' => '07:30'],
        ])->assertOk()->json('data');
        $this->assertTrue($c['marketing']['product_updates']);
        $this->assertFalse($c['marketing']['exclusive_offers']);
        $this->assertSame('mr', $c['language']);
        $this->assertSame(['enabled' => true, 'start' => '23:00', 'end' => '07:30'], $c['quiet_hours']);
        $this->assertSame('mr', $this->getJson('/api/v1/customer/profile')->json('data.language'));
    }

    public function test_communication_rejects_bad_values_and_ignores_unknown_keys(): void
    {
        $this->as($this->customer());
        $this->putJson('/api/v1/customer/communication', ['language' => 'klingon'])->assertStatus(422);
        $this->putJson('/api/v1/customer/communication', ['quiet_hours' => ['start' => '25:99']])->assertStatus(422);
        $this->putJson('/api/v1/customer/communication', ['events' => ['payment_reminders' => ['sms' => 'maybe']]])->assertStatus(422);
        $c = $this->putJson('/api/v1/customer/communication', ['events' => ['hack' => ['sms' => true]], 'marketing' => ['evil' => true]])->assertOk()->json('data');
        $this->assertArrayNotHasKey('hack', $c['events']);
        $this->assertArrayNotHasKey('evil', $c['marketing']);
    }

    // ── security ──────────────────────────────────────────────────────────────

    public function test_sessions_list_marks_the_current_one_and_others_can_be_signed_out(): void
    {
        $user = $this->customer();
        // a second sign-in elsewhere
        $this->postJson('/api/v1/customer/auth/login', ['email' => $user->email, 'password' => 'abcdefgh'])->assertOk();
        $token = $this->postJson('/api/v1/customer/auth/login', ['email' => $user->email, 'password' => 'abcdefgh'])->json('data.token');

        $rows = $this->withToken($token)->getJson('/api/v1/customer/security/sessions')->assertOk()->json('data');
        $this->assertGreaterThanOrEqual(3, count($rows));
        $this->assertSame(1, collect($rows)->where('current', true)->count());

        $this->withToken($token)->deleteJson('/api/v1/customer/security/sessions/others')->assertOk();
        $rows = $this->withToken($token)->getJson('/api/v1/customer/security/sessions')->json('data');
        $this->assertCount(1, $rows);
        $this->assertTrue($rows[0]['current']);
    }

    public function test_changing_the_password_still_works_from_the_profile_section(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/auth/password', ['current_password' => 'wrong', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])->assertStatus(422);
        $this->postJson('/api/v1/auth/password', ['current_password' => 'abcdefgh', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])->assertOk();
    }

    // ── data request ──────────────────────────────────────────────────────────

    public function test_the_data_export_contains_only_the_callers_own_data_and_no_secrets(): void
    {
        Storage::fake('local');
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $this->as($a);
        $this->postJson('/api/v1/customer/bank-accounts', $this->bank())->assertCreated();
        $this->postJson('/api/v1/customer/upi-ids', ['vpa' => 'rohan@upi'])->assertCreated();
        $this->postJson('/api/v1/customer/applications', ['product' => 'personal-loan', 'loan_amount' => 300000, 'city' => 'Nagpur', 'applicant_phone' => '9876543210', 'consent' => true])->assertCreated();

        $json = $this->getJson('/api/v1/customer/data-export')->assertOk()->getContent();
        $d = json_decode($json, true)['data'];
        $this->assertSame('a@example.test', $d['account']['email']);
        $this->assertCount(1, $d['bank_accounts']);
        $this->assertCount(1, $d['applications']);
        $this->assertStringNotContainsString('123456789012', $json, 'full account numbers are never exported');
        $this->assertStringNotContainsString('password', strtolower($json));

        $this->as($b);
        $d = $this->getJson('/api/v1/customer/data-export')->json('data');
        $this->assertSame('b@example.test', $d['account']['email']);
        $this->assertSame([], $d['bank_accounts']);
        $this->assertSame([], $d['applications']);
    }

    // ── prefill: forms start filled with what we already know ─────────────────

    private function fullApply(array $o = []): array
    {
        return array_merge([
            'product' => 'personal-loan', 'loan_amount' => 500000, 'tenure_months' => 36, 'monthly_income' => 75000,
            'city' => 'Nagpur', 'applicant_phone' => '9876543210', 'consent' => true, 'employment_type' => 'salaried',
            'applicant' => ['dob' => '1989-07-12', 'gender' => 'male', 'marital_status' => 'married', 'pan' => 'ABCDE1234F', 'aadhaar' => '123456789012'],
            'employment' => ['company' => 'ABC Pvt. Ltd.', 'designation' => 'Senior Executive', 'experience_years' => 5, 'office_address' => '123, Business Park'],
        ], $o);
    }

    public function test_prefill_requires_a_signed_in_customer(): void
    {
        $this->getJson('/api/v1/customer/profile/prefill')->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create(['role' => 'employee']));
        $this->getJson('/api/v1/customer/profile/prefill')->assertForbidden();
    }

    public function test_a_brand_new_account_prefills_only_the_account_basics(): void
    {
        $this->as($this->customer());
        $d = $this->getJson('/api/v1/customer/profile/prefill')->assertOk()->json('data');
        $this->assertSame('Rohan Sharma', $d['name']);
        $this->assertSame('c1@example.test', $d['email']);
        $this->assertSame('9876543210', $d['phone']);
        $this->assertFalse($d['has_saved_application']);
        foreach (['dob', 'gender', 'marital_status', 'pan', 'company', 'designation', 'city', 'monthly_income'] as $k) {
            $this->assertNull($d[$k], "$k should be empty for a new account");
        }
    }

    public function test_profile_details_and_address_feed_the_prefill(): void
    {
        $this->as($this->customer());
        $this->patchJson('/api/v1/customer/profile/details', ['dob' => '1990-01-02', 'gender' => 'female', 'marital_status' => 'single', 'occupation' => 'Designer'])->assertOk();
        $this->putJson('/api/v1/customer/profile/addresses', ['current_address' => ['line1' => '9 Civil Lines', 'city' => 'Pune', 'state' => 'Maharashtra', 'pincode' => '411001'], 'permanent_same_as_current' => true])->assertOk();

        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertSame('1990-01-02', $d['dob']);
        $this->assertSame('female', $d['gender']);
        $this->assertSame('Designer', $d['occupation']);
        $this->assertSame('Pune', $d['city']);
    }

    public function test_the_latest_application_feeds_the_prefill_and_the_aadhaar_is_only_returned_to_its_owner(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->fullApply())->assertCreated();

        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertTrue($d['has_saved_application']);
        $this->assertSame('ABCDE1234F', $d['pan']);
        $this->assertSame('ABC Pvt. Ltd.', $d['company']);
        $this->assertSame('Senior Executive', $d['designation']);
        $this->assertEquals(5, $d['experience_years']);
        $this->assertSame('123, Business Park', $d['office_address']);
        $this->assertSame('salaried', $d['employment_type']);
        $this->assertEquals(75000, $d['monthly_income']);
        $this->assertSame('Nagpur', $d['city']);
        $this->assertSame('9012', $d['aadhaar_last4']);
        // the owner gets their own number back so the next form is pre-filled ...
        $this->assertSame('123456789012', $d['aadhaar']);
        // ... but the profile view only ever shows it masked, and it is encrypted at rest
        $profile = $this->getJson('/api/v1/customer/profile')->json('data');
        $this->assertSame('XXXX XXXX 9012', $profile['aadhaar_masked']);
        $this->assertStringNotContainsString('123456789012', json_encode($profile));
        $this->assertStringNotContainsString('123456789012', (string) \Illuminate\Support\Facades\DB::table('customer_profiles')->value('aadhaar'));
    }

    public function test_the_newest_application_wins(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->fullApply())->assertCreated();
        $this->postJson('/api/v1/customer/applications', $this->fullApply(['update_profile' => true, 'product' => 'home-loan', 'monthly_income' => 90000, 'city' => 'Mumbai', 'employment' => ['company' => 'XYZ Ltd', 'designation' => 'Director']]))->assertCreated();

        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertSame('XYZ Ltd', $d['company']);
        $this->assertSame('Mumbai', $d['city']);
        $this->assertEquals(90000, $d['monthly_income']);
    }

    public function test_everything_the_application_asks_can_be_saved_on_the_profile_and_prefills_the_form(): void
    {
        $this->as($this->customer());
        $this->patchJson('/api/v1/customer/profile/details', [
            'pan' => 'abcde1234f', 'aadhaar' => '1234 5678 9012', 'employment_type' => 'business', 'company' => 'Acme', 'designation' => 'Owner',
            'experience_years' => 7, 'monthly_income' => 120000, 'office_address' => '5 Market Rd', 'work_city' => 'Pune',
        ])->assertOk();

        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertSame('ABCDE1234F', $d['pan']);
        $this->assertSame('123456789012', $d['aadhaar']);
        $this->assertSame('business', $d['employment_type']);
        $this->assertSame('Acme', $d['company']);
        $this->assertEquals(7, $d['experience_years']);
        $this->assertEquals(120000, $d['monthly_income']);
        $this->assertSame('Pune', $d['city']);

        // saving other details later does not wipe them, and a blank Aadhaar box keeps the saved one
        $this->patchJson('/api/v1/customer/profile/details', ['occupation' => 'Founder', 'aadhaar' => ''])->assertOk();
        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertSame('123456789012', $d['aadhaar']);
        $this->assertSame('ABCDE1234F', $d['pan']);

        $this->patchJson('/api/v1/customer/profile/details', ['aadhaar' => '123'])->assertStatus(422)->assertJsonValidationErrors('aadhaar');
    }

    public function test_the_application_can_use_another_name_and_email_and_optionally_update_the_profile(): void
    {
        $this->as($this->customer());
        $this->patchJson('/api/v1/customer/profile/details', ['company' => 'Old Co'])->assertOk();

        $res = $this->postJson('/api/v1/customer/applications', $this->fullApply([
            'applicant_name' => 'Rohan K Sharma', 'applicant_email' => 'rohan.work@example.test', 'update_profile' => false,
            'employment' => ['company' => 'New Co', 'designation' => 'Lead'],
        ]))->assertCreated();
        $this->assertSame('Old Co', $this->getJson('/api/v1/customer/profile/prefill')->json('data.company'));
        $this->assertSame('Rohan Sharma', $this->getJson('/api/v1/customer/profile/prefill')->json('data.name'));
        $this->assertNotNull($res->json('data.id'));

        $this->postJson('/api/v1/customer/applications', $this->fullApply([
            'applicant_name' => 'Rohan K Sharma', 'update_profile' => true, 'employment' => ['company' => 'New Co', 'designation' => 'Lead'],
        ]))->assertCreated();
        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertSame('New Co', $d['company']);
        $this->assertSame('Rohan K Sharma', $d['name']);
        $this->assertSame('c1@example.test', $d['email']); // the login email is never changed from an application
    }

    public function test_the_profile_beats_the_application_and_a_kyc_pan_beats_both(): void
    {
        Storage::fake('local');
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->fullApply())->assertCreated();
        // the profile was filled by the application; now the customer edits it themselves
        $this->patchJson('/api/v1/customer/profile/details', ['gender' => 'other'])->assertOk();
        $this->assertSame('other', $this->getJson('/api/v1/customer/profile/prefill')->json('data.gender'));

        $this->postJson('/api/v1/customer/kyc/pan', ['file' => UploadedFile::fake()->create('pan.pdf', 10, 'application/pdf'), 'number' => 'ZZZZZ9999Z'])->assertCreated();
        $this->assertSame('ZZZZZ9999Z', $this->getJson('/api/v1/customer/profile/prefill')->json('data.pan'));
    }

    public function test_one_customers_prefill_never_contains_anothers_data(): void
    {
        $a = $this->customer('a@example.test');
        $b = $this->customer('b@example.test');
        $this->as($a);
        $this->postJson('/api/v1/customer/applications', $this->fullApply())->assertCreated();
        $this->patchJson('/api/v1/customer/profile/details', ['occupation' => 'Secret job'])->assertOk();

        $this->as($b);
        $d = $this->getJson('/api/v1/customer/profile/prefill')->json('data');
        $this->assertSame('b@example.test', $d['email']);
        $this->assertFalse($d['has_saved_application']);
        $this->assertNull($d['pan']);
        $this->assertNull($d['company']);
        $this->assertNull($d['occupation']);
        $this->assertStringNotContainsString('ABC Pvt', json_encode($d));
    }

    public function test_applying_remembers_the_personal_answers_on_the_profile(): void
    {
        $this->as($this->customer());
        $this->postJson('/api/v1/customer/applications', $this->fullApply())->assertCreated();

        $p = $this->getJson('/api/v1/customer/profile')->json('data');
        $this->assertSame('1989-07-12', $p['dob']);
        $this->assertSame('male', $p['gender']);
        $this->assertSame('married', $p['marital_status']);
        $this->assertSame('Senior Executive', $p['occupation']);
    }

    public function test_applying_never_overwrites_what_the_customer_already_saved(): void
    {
        $this->as($this->customer());
        $this->patchJson('/api/v1/customer/profile/details', ['dob' => '1980-05-05', 'gender' => 'female', 'marital_status' => 'single', 'occupation' => 'Doctor'])->assertOk();
        $this->postJson('/api/v1/customer/applications', $this->fullApply())->assertCreated();

        $p = $this->getJson('/api/v1/customer/profile')->json('data');
        $this->assertSame('1980-05-05', $p['dob']);
        $this->assertSame('female', $p['gender']);
        $this->assertSame('single', $p['marital_status']);
        $this->assertSame('Doctor', $p['occupation']);
    }

    // ── closing the account ───────────────────────────────────────────────────

    public function test_deletion_needs_the_password_a_reason_and_the_confirmation_tick(): void
    {
        $this->as($this->customer());
        $ok = ['password' => 'abcdefgh', 'reason' => 'I no longer need it', 'confirm' => true];
        $this->postJson('/api/v1/customer/account/deletion-request', array_merge($ok, ['password' => 'wrong']))->assertStatus(422)->assertJsonValidationErrors('password');
        $this->postJson('/api/v1/customer/account/deletion-request', array_diff_key($ok, ['password' => 1]))->assertStatus(422);
        $this->postJson('/api/v1/customer/account/deletion-request', array_diff_key($ok, ['reason' => 1]))->assertStatus(422);
        $this->postJson('/api/v1/customer/account/deletion-request', array_merge($ok, ['confirm' => false]))->assertStatus(422);
        $this->assertNull($this->getJson('/api/v1/customer/profile')->json('data.deletion_requested_at'));
    }

    public function test_deletion_is_blocked_while_a_loan_is_active_and_allowed_when_none_is(): void
    {
        $this->as($this->customer());
        $id = $this->postJson('/api/v1/customer/applications', ['product' => 'personal-loan', 'loan_amount' => 300000, 'city' => 'Nagpur', 'applicant_phone' => '9876543210', 'consent' => true])->json('data.id');
        $body = ['password' => 'abcdefgh', 'reason' => 'Other', 'confirm' => true];

        $this->postJson('/api/v1/customer/account/deletion-request', $body)->assertStatus(422);
        $this->assertNull($this->getJson('/api/v1/customer/profile')->json('data.deletion_requested_at'));

        LoanLead::query()->whereKey($id)->update(['status' => LeadStatus::Closed->value]);
        $this->postJson('/api/v1/customer/account/deletion-request', $body + ['comments' => 'Moving abroad'])->assertOk();
        $this->assertNotNull($this->getJson('/api/v1/customer/profile')->json('data.deletion_requested_at'));

        $this->deleteJson('/api/v1/customer/account/deletion-request')->assertOk();
        $this->assertNull($this->getJson('/api/v1/customer/profile')->json('data.deletion_requested_at'));
    }

    public function test_a_rejected_application_does_not_block_deletion(): void
    {
        $this->as($this->customer());
        $id = $this->postJson('/api/v1/customer/applications', ['product' => 'personal-loan', 'loan_amount' => 300000, 'city' => 'Nagpur', 'applicant_phone' => '9876543210', 'consent' => true])->json('data.id');
        LoanLead::query()->whereKey($id)->update(['status' => LeadStatus::Rejected->value]);
        $this->postJson('/api/v1/customer/account/deletion-request', ['password' => 'abcdefgh', 'reason' => 'Other', 'confirm' => true])->assertOk();
    }

    public function test_deactivating_needs_the_password_and_signs_the_account_out_everywhere(): void
    {
        $user = $this->customer();
        $token = $this->postJson('/api/v1/customer/auth/login', ['email' => $user->email, 'password' => 'abcdefgh'])->json('data.token');

        $this->withToken($token)->postJson('/api/v1/customer/account/deactivate', ['password' => 'wrong'])->assertStatus(422);
        $this->assertTrue($user->fresh()->is_active);

        $this->withToken($token)->postJson('/api/v1/customer/account/deactivate', ['password' => 'abcdefgh'])->assertOk();
        $this->assertFalse($user->fresh()->is_active);
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/v1/customer/auth/login', ['email' => $user->email, 'password' => 'abcdefgh'])->assertStatus(403);
    }
}
