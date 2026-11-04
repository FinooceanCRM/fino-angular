<?php

namespace Database\Seeders;

use App\Enums\LeadStatus;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\CustomerAuthService;
use App\Services\CustomerPortalService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Demo customer for trying the My Documents page: three applications whose documents cover every state
 * (verified, under review, rejected with a reason, not uploaded, optional) and several file types.
 * Run: php artisan db:seed --class=CustomerDocumentsDemoSeeder   (login below; safe to re-run).
 * For an existing customer: DEMO_EMAIL=kk@gmail.com php artisan db:seed --class=CustomerDocumentsDemoSeeder
 * — their account and applications are left alone; demo documents are added to their first two applications.
 */
class CustomerDocumentsDemoSeeder extends Seeder
{
    public const EMAIL = 'demo.customer@finoocean.test';
    public const PASSWORD = 'demo12345';

    public function run(): void
    {
        $email = strtolower((string) (getenv('DEMO_EMAIL') ?: self::EMAIL));
        $user = User::query()->where('email', $email)->first();
        if ($user !== null && $email !== self::EMAIL) {
            $this->attachToExisting($user);

            return;
        }
        if ($user === null) {
            app(CustomerAuthService::class)->register([
                'name' => 'Rohan Sharma', 'email' => self::EMAIL, 'phone' => '9876543210',
                'password' => self::PASSWORD, 'terms' => true,
            ]);
            $user = User::query()->where('email', self::EMAIL)->firstOrFail();
        }

        if (LoanLead::query()->whereHas('customer', fn ($q) => $q->where('user_id', $user->id))->exists()) {
            $this->command?->info('Demo customer already has applications — nothing to do.');

            return;
        }

        $portal = app(CustomerPortalService::class);
        $apps = [
            ['personal-loan', 500000, LeadStatus::DocumentsPending, [
                ['aadhaar', 'aadhar.pdf', 'verified', null, '12 days'],
                ['pan', 'pan.jpg', 'verified', null, '12 days'],
                ['address_proof', 'utility_bill.pdf', 'verified', null, '10 days'],
                ['income_proof', 'salary_slip.pdf', 'pending', null, '8 days'],
                ['bank_statement', 'bank_statement.png', 'rejected', 'The statement is cut off — please upload the last 6 months in full.', '8 days'],
            ]],
            ['home-loan', 2500000, LeadStatus::InProgress, [
                ['aadhaar', 'aadhar_card.pdf', 'verified', null, '5 days'],
                ['pan', 'pan_card.pdf', 'pending', null, '5 days'],
                ['property_documents', 'agreement.pdf', 'pending', null, '5 days'],
            ]],
            ['business-loan', 1000000, LeadStatus::New, []],
        ];

        foreach ($apps as [$product, $amount, $status, $docs]) {
            $result = $portal->apply($user, [
                'product' => $product, 'loan_amount' => $amount, 'tenure_months' => 60,
                'monthly_income' => 80000, 'city' => 'Nagpur', 'consent' => true,
            ]);
            $lead = $result['lead'];
            $lead->update(['status' => $status->value]);

            foreach ($docs as [$type, $name, $state, $remarks, $ago]) {
                $path = "lead-documents/{$lead->id}/".str_replace('.', '-demo.', $name);
                Storage::disk('local')->put($path, $this->sampleFile($name));
                $doc = Document::query()->create([
                    'loan_lead_id' => $lead->id, 'uploaded_by' => $user->id, 'document_type' => $type,
                    'original_name' => $name, 'path' => $path,
                    'mime_type' => str_ends_with($name, '.pdf') ? 'application/pdf' : (str_ends_with($name, '.png') ? 'image/png' : 'image/jpeg'),
                    'size_bytes' => strlen($this->sampleFile($name)), 'status' => $state, 'remarks' => $remarks,
                ]);
                $doc->forceFill(['created_at' => now()->sub($ago), 'updated_at' => now()->sub($ago)])->save();
            }
        }

        $this->command?->info('Demo customer ready: '.self::EMAIL.' / '.self::PASSWORD);
    }

    /** Adds the demo documents to an existing customer's first two applications (no new applications, no account changes). */
    private function attachToExisting(User $user): void
    {
        $leads = LoanLead::query()->whereHas('customer', fn ($q) => $q->where('user_id', $user->id))->orderBy('id')->get();
        if ($leads->isEmpty()) {
            $this->command?->warn($user->email.' has no applications yet — apply for a loan first, then re-run.');

            return;
        }

        $sets = [
            [
                ['aadhaar', 'aadhar.pdf', 'verified', null, '12 days'],
                ['pan', 'pan.jpg', 'verified', null, '12 days'],
                ['address_proof', 'utility_bill.pdf', 'verified', null, '10 days'],
                ['income_proof', 'salary_slip.pdf', 'pending', null, '8 days'],
                ['bank_statement', 'bank_statement.png', 'rejected', 'The statement is cut off — please upload the last 6 months in full.', '8 days'],
            ],
            [
                ['aadhaar', 'aadhar_card.pdf', 'verified', null, '5 days'],
                ['pan', 'pan_card.pdf', 'pending', null, '5 days'],
                ['property_documents', 'agreement.pdf', 'pending', null, '5 days'],
            ],
        ];

        $added = 0;
        foreach ($leads->take(2) as $i => $lead) {
            if (Document::query()->where('loan_lead_id', $lead->id)->exists()) {
                continue; // never touch a lead that already has real uploads
            }
            foreach ($sets[$i] as [$type, $name, $state, $remarks, $ago]) {
                $this->makeDocument($user, $lead, $type, $name, $state, $remarks, $ago);
                $added++;
            }
        }

        $this->command?->info("Added {$added} demo documents for {$user->email}.");
    }

    private function makeDocument(User $user, LoanLead $lead, string $type, string $name, string $state, ?string $remarks, string $ago): void
    {
        $path = "lead-documents/{$lead->id}/".str_replace('.', '-demo.', $name);
        Storage::disk('local')->put($path, $this->sampleFile($name));
        $doc = Document::query()->create([
            'loan_lead_id' => $lead->id, 'uploaded_by' => $user->id, 'document_type' => $type,
            'original_name' => $name, 'path' => $path,
            'mime_type' => str_ends_with($name, '.pdf') ? 'application/pdf' : (str_ends_with($name, '.png') ? 'image/png' : 'image/jpeg'),
            'size_bytes' => strlen($this->sampleFile($name)), 'status' => $state, 'remarks' => $remarks,
        ]);
        $doc->forceFill(['created_at' => now()->sub($ago), 'updated_at' => now()->sub($ago)])->save();
    }

    /** Tiny but genuinely valid file of the right type, so View / Download open in a browser. */
    private function sampleFile(string $name): string
    {
        if (str_ends_with($name, '.pdf')) {
            return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                ."3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
                ."4 0 obj<</Length 62>>stream\nBT /F1 14 Tf 20 60 Td (Demo document - {$name}) Tj ET\nendstream endobj\n"
                ."5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF";
        }
        if (str_ends_with($name, '.png')) {
            return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        }

        return base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=');
    }
}
