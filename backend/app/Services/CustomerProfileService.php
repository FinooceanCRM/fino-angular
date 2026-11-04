<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\CustomerBankAccount;
use App\Models\CustomerKycDocument;
use App\Models\CustomerProfile;
use App\Models\CustomerUpiId;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The customer's own profile: personal details, KYC documents, bank accounts, UPI IDs, communication
 * preferences, sessions, data export and account closure. Everything is looked up through the caller's
 * user id, so one customer can never reach another's rows.
 */
class CustomerProfileService
{
    private const DISK = 'local';

    /** KYC document types. The first five are required for "KYC complete". */
    public const KYC_TYPES = [
        'pan' => 'PAN Card',
        'aadhaar' => 'Aadhaar Card',
        'address_proof' => 'Address Proof',
        'bank_proof' => 'Bank Passbook / Cancelled Cheque',
        'selfie' => 'Selfie with Document',
        'income_proof' => 'Income Proof',
        'additional' => 'Additional Document',
    ];
    public const KYC_REQUIRED = ['pan', 'aadhaar', 'address_proof', 'bank_proof', 'selfie'];

    public const MAX_BANK_ACCOUNTS = 5;

    public function __construct(private readonly NotificationService $notifications)
    {
    }
    public const MAX_UPI_IDS = 8;

    public const NOTIFICATION_EVENTS = ['payment_reminders', 'payment_confirmations', 'disbursal_updates', 'application_updates', 'account_alerts'];
    public const CHANNELS = ['email', 'sms', 'whatsapp', 'in_app'];
    public const MARKETING = ['exclusive_offers', 'education_tips', 'product_updates', 'festive_offers', 'surveys'];

    // ── profile ───────────────────────────────────────────────────────────────

    public function profile(User $user): CustomerProfile
    {
        return CustomerProfile::query()->firstOrCreate(['user_id' => $user->id], ['language' => 'en']);
    }

    /** @return array<string, mixed> */
    public function present(User $user): array
    {
        $p = $this->profile($user);
        $customer = Customer::query()->where('user_id', $user->id)->first();

        return [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'customer_id' => $customer ? 'FIN'.str_pad((string) $customer->id, 8, '0', STR_PAD_LEFT) : null,
            'dob' => $p->dob?->toDateString(),
            'gender' => $p->gender,
            'marital_status' => $p->marital_status,
            'occupation' => $p->occupation,
            'pan' => $p->pan,
            'aadhaar_masked' => $p->aadhaar ? 'XXXX XXXX '.substr($p->aadhaar, -4) : null,
            'employment_type' => $p->employment_type,
            'company' => $p->company,
            'designation' => $p->designation,
            'experience_years' => $p->experience_years,
            'monthly_income' => $p->monthly_income,
            'office_address' => $p->office_address,
            'work_city' => $p->work_city,
            'language' => $p->language,
            'has_photo' => $p->photo_path !== null,
            'current_address' => $p->current_address,
            'permanent_address' => $p->permanent_same_as_current ? $p->current_address : $p->permanent_address,
            'permanent_same_as_current' => $p->permanent_same_as_current,
            'kyc' => $this->kycSummary($user),
            'deletion_requested_at' => $p->deletion_requested_at?->toIso8601String(),
        ];
    }

    /** @param array<string, mixed> $data */
    public function updateDetails(User $user, array $data): CustomerProfile
    {
        $p = $this->profile($user);
        $p->update(array_intersect_key($data, array_flip([
            'dob', 'gender', 'marital_status', 'occupation', 'language', 'pan', 'employment_type', 'company', 'designation',
            'experience_years', 'monthly_income', 'office_address', 'work_city',
        ])));
        // A blank Aadhaar box means "keep what is saved"; a 12-digit value replaces it.
        if (! empty($data['aadhaar'])) {
            $p->update(['aadhaar' => $data['aadhaar']]);
        }

        return $p->refresh();
    }

    /** @param array<string, mixed> $data */
    public function updateAddresses(User $user, array $data): CustomerProfile
    {
        $p = $this->profile($user);
        $same = (bool) ($data['permanent_same_as_current'] ?? false);
        $p->update([
            'current_address' => $data['current_address'] ?? $p->current_address,
            'permanent_same_as_current' => $same,
            'permanent_address' => $same ? null : ($data['permanent_address'] ?? $p->permanent_address),
        ]);

        return $p->refresh();
    }

    public function storePhoto(User $user, UploadedFile $file): void
    {
        $p = $this->profile($user);
        $path = $file->store('customer-photos/'.$user->id, self::DISK);
        if ($path === false) {
            throw new DomainException('The photo could not be stored.', 500);
        }
        if ($p->photo_path !== null) {
            Storage::disk(self::DISK)->delete($p->photo_path);
        }
        $p->update(['photo_path' => $path]);
    }

    public function removePhoto(User $user): void
    {
        $p = $this->profile($user);
        if ($p->photo_path !== null) {
            Storage::disk(self::DISK)->delete($p->photo_path);
            $p->update(['photo_path' => null]);
        }
    }

    public function photo(User $user): StreamedResponse
    {
        $path = $this->profile($user)->photo_path;
        if ($path === null || ! Storage::disk(self::DISK)->exists($path)) {
            throw new DomainException('No profile photo.', 404);
        }

        return Storage::disk(self::DISK)->response($path);
    }

    // ── prefill ───────────────────────────────────────────────────────────────

    /**
     * Everything we already know about this customer, for pre-filling forms (apply flow, bank, KYC).
     * Order of trust: what they saved in their profile, then the KYC PAN, then their latest application.
     * The full Aadhaar number is never kept, so it is never offered back.
     *
     * @return array<string, mixed>
     */
    public function prefill(User $user): array
    {
        $p = $this->profile($user);
        $lead = $this->latestLead($user);
        $details = (array) ($lead?->details ?? []);
        $applicant = (array) ($details['applicant'] ?? []);
        $work = (array) ($details['employment'] ?? []);
        $kycPan = CustomerKycDocument::query()->where('user_id', $user->id)->where('type', 'pan')->latest('id')->value('reference');

        return [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'dob' => $p->dob?->toDateString() ?? ($applicant['dob'] ?? null),
            'gender' => $p->gender ?? ($applicant['gender'] ?? null),
            'marital_status' => $p->marital_status ?? ($applicant['marital_status'] ?? null),
            'occupation' => $p->occupation,
            'pan' => $p->pan ?? $kycPan ?? ($applicant['pan'] ?? null),
            // The owner's own Aadhaar, so the form can be filled; the form lets them change it.
            'aadhaar' => $p->aadhaar,
            'aadhaar_last4' => $p->aadhaar ? substr($p->aadhaar, -4) : ($applicant['aadhaar_last4'] ?? null),
            'city' => $p->work_city ?? (($p->current_address['city'] ?? null) ?: $lead?->city),
            'employment_type' => $p->employment_type ?? $lead?->employment_type,
            'company' => $p->company ?? ($work['company'] ?? null),
            'designation' => $p->designation ?? ($work['designation'] ?? null),
            'experience_years' => $p->experience_years ?? (isset($work['experience_years']) ? (float) $work['experience_years'] : null),
            'office_address' => $p->office_address ?? ($work['office_address'] ?? null),
            'monthly_income' => $p->monthly_income ?? ($lead?->monthly_income !== null ? (float) $lead->monthly_income : null),
            'has_saved_application' => $lead !== null,
        ];
    }

    /**
     * After an application, keeps the answers on the profile so the next form is pre-filled.
     * By default only blank profile fields are filled. When the customer ticked "update my profile",
     * what they entered replaces what was saved (and a new name is saved on the account).
     *
     * @param array<string, mixed> $data the validated application payload
     */
    public function rememberFromApplication(User $user, array $data, ?string $aadhaar = null, bool $overwrite = false): void
    {
        $p = $this->profile($user);
        $a = (array) ($data['applicant'] ?? []);
        $w = (array) ($data['employment'] ?? []);

        $candidates = [
            'dob' => $a['dob'] ?? null,
            'gender' => $a['gender'] ?? null,
            'marital_status' => $a['marital_status'] ?? null,
            'pan' => $a['pan'] ?? null,
            'aadhaar' => $aadhaar,
            'occupation' => $w['designation'] ?? null,
            'employment_type' => $data['employment_type'] ?? null,
            'company' => $w['company'] ?? null,
            'designation' => $w['designation'] ?? null,
            'experience_years' => $w['experience_years'] ?? null,
            'monthly_income' => $data['monthly_income'] ?? null,
            'office_address' => $w['office_address'] ?? null,
            'work_city' => $data['city'] ?? null,
        ];

        $fill = [];
        foreach ($candidates as $column => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            if ($overwrite || $p->{$column} === null || $p->{$column} === '') {
                $fill[$column] = $value;
            }
        }
        if ($fill !== []) {
            $p->update($fill);
        }

        $name = trim((string) ($data['applicant_name'] ?? ''));
        if ($overwrite && $name !== '' && $name !== $user->name) {
            $user->update(['name' => $name]);
        }
    }

    private function latestLead(User $user): ?LoanLead
    {
        $customer = Customer::query()->where('user_id', $user->id)->first();

        return $customer?->leads()->orderByDesc('loan_leads.id')->first();
    }

    // ── KYC ───────────────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function kycDocuments(User $user): array
    {
        return CustomerKycDocument::query()->where('user_id', $user->id)->orderBy('id')->get()
            ->map(fn (CustomerKycDocument $d): array => $this->presentKyc($d))->all();
    }

    /** @return array<string, mixed> */
    public function kycSummary(User $user): array
    {
        $latest = CustomerKycDocument::query()->where('user_id', $user->id)->orderBy('id')->get()->groupBy('type')->map->last();
        $verified = collect(self::KYC_REQUIRED)->filter(fn (string $t) => $latest->get($t)?->status === 'verified')->count();
        $uploaded = collect(self::KYC_REQUIRED)->filter(fn (string $t) => $latest->has($t))->count();
        $total = count(self::KYC_REQUIRED);

        return [
            'percent' => (int) round($verified / $total * 100),
            'verified' => $verified,
            'uploaded' => $uploaded,
            'total' => $total,
            'complete' => $verified === $total,
            'stage' => $verified === $total ? 'verified' : ($uploaded === $total ? 'in_review' : 'upload'),
            'types' => collect(self::KYC_TYPES)->map(fn (string $label, string $type): array => [
                'type' => $type,
                'label' => $label,
                'required' => in_array($type, self::KYC_REQUIRED, true),
                'status' => $latest->get($type)?->status ?? 'not_uploaded',
                'document' => $latest->has($type) ? $this->presentKyc($latest->get($type)) : null,
            ])->values()->all(),
        ];
    }

    public function uploadKyc(User $user, string $type, UploadedFile $file, ?string $number): CustomerKycDocument
    {
        if (! array_key_exists($type, self::KYC_TYPES)) {
            throw new DomainException('Unsupported document type.', 422, ['type' => ['Unsupported document type.']]);
        }

        $latest = CustomerKycDocument::query()->where('user_id', $user->id)->where('type', $type)->latest('id')->first();
        if ($type !== 'additional' && $latest?->status === 'verified') {
            throw new DomainException('This document has already been verified.', 422);
        }

        $reference = null;
        if ($number !== null && $number !== '') {
            if ($type === 'pan') {
                $number = strtoupper(trim($number));
                if (! preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]$/', $number)) {
                    throw new DomainException('Enter a valid PAN, like ABCDE1234F.', 422, ['number' => ['Enter a valid PAN, like ABCDE1234F.']]);
                }
                $reference = $number;
            } elseif ($type === 'aadhaar') {
                $digits = preg_replace('/[\s-]+/', '', $number) ?? '';
                if (! preg_match('/^\d{12}$/', $digits)) {
                    throw new DomainException('Aadhaar has 12 digits.', 422, ['number' => ['Aadhaar has 12 digits.']]);
                }
                $reference = 'XXXX XXXX '.substr($digits, -4); // only the last four digits are ever kept
            }
        }

        $path = $file->store('customer-kyc/'.$user->id, self::DISK);
        if ($path === false) {
            throw new DomainException('The document could not be stored.', 500);
        }

        // A PAN typed with the upload is the customer's latest word on it, so keep the profile in step.
        if ($type === 'pan' && $reference !== null) {
            $this->profile($user)->update(['pan' => $reference]);
        }

        $doc = CustomerKycDocument::query()->create([
            'user_id' => $user->id, 'type' => $type, 'original_name' => $file->getClientOriginalName(), 'path' => $path,
            'mime_type' => $file->getClientMimeType(), 'size_bytes' => $file->getSize() ?: 0, 'status' => 'pending',
            'reference' => $reference ?? $latest?->reference,
        ]);

        if ($type !== 'additional' && $latest !== null) {
            Storage::disk(self::DISK)->delete($latest->path);
            $latest->delete();
        }

        $this->notifications->notifyMany(
            TelecallerVerificationService::queueStaffIds(),
            'kyc.uploaded',
            'KYC document to verify',
            sprintf('%s uploaded %s.', $user->name, self::KYC_TYPES[$type]),
            ['kyc_id' => $doc->id],
        );

        return $doc;
    }

    public function kycDownload(User $user, int $id): StreamedResponse
    {
        $doc = CustomerKycDocument::query()->where('user_id', $user->id)->findOrFail($id);

        return Storage::disk(self::DISK)->response($doc->path, $doc->original_name);
    }

    /** @return array<string, mixed> */
    private function presentKyc(CustomerKycDocument $d): array
    {
        return [
            'id' => $d->id, 'type' => $d->type, 'label' => self::KYC_TYPES[$d->type] ?? $d->type, 'file_name' => $d->original_name,
            'mime_type' => $d->mime_type, 'status' => $d->status, 'remarks' => $d->status === 'rejected' ? $d->remarks : null,
            'reference' => $d->reference, 'uploaded_at' => $d->created_at?->toIso8601String(),
        ];
    }

    // ── bank accounts ─────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function bankAccounts(User $user): array
    {
        return CustomerBankAccount::query()->where('user_id', $user->id)->orderByDesc('is_primary')->orderBy('id')->get()
            ->map(fn (CustomerBankAccount $b): array => $this->presentBank($b))->all();
    }

    /** @param array<string, mixed> $data */
    public function addBankAccount(User $user, array $data): CustomerBankAccount
    {
        $count = CustomerBankAccount::query()->where('user_id', $user->id)->count();
        if ($count >= self::MAX_BANK_ACCOUNTS) {
            throw new DomainException('You can save up to '.self::MAX_BANK_ACCOUNTS.' bank accounts.', 422);
        }

        $number = preg_replace('/\s+/', '', (string) $data['account_number']) ?? '';
        $ifsc = strtoupper((string) $data['ifsc']);

        $existing = CustomerBankAccount::query()->where('user_id', $user->id)->where('ifsc', $ifsc)->where('account_last4', substr($number, -4))->get();
        foreach ($existing as $e) {
            if (Crypt::decryptString($e->account_number_encrypted) === $number) {
                throw new DomainException('This bank account is already saved.', 422, ['account_number' => ['This bank account is already saved.']]);
            }
        }

        $bank = CustomerBankAccount::query()->create([
            'user_id' => $user->id,
            'holder_name' => trim((string) $data['holder_name']),
            'bank_name' => trim((string) $data['bank_name']),
            'account_number_encrypted' => Crypt::encryptString($number),
            'account_last4' => substr($number, -4),
            'ifsc' => $ifsc,
            'account_type' => $data['account_type'],
            'branch' => isset($data['branch']) ? trim((string) $data['branch']) : null,
            'is_primary' => $count === 0,
            'status' => 'pending',
        ]);

        $this->notifications->notifyMany(
            TelecallerVerificationService::queueStaffIds(),
            'bank.added',
            'Bank account to verify',
            sprintf('%s added a %s account ending %s.', $user->name, $bank->bank_name, $bank->account_last4),
            ['bank_id' => $bank->id],
        );

        return $bank;
    }

    public function setPrimaryBank(User $user, int $id): void
    {
        $bank = CustomerBankAccount::query()->where('user_id', $user->id)->findOrFail($id);
        CustomerBankAccount::query()->where('user_id', $user->id)->update(['is_primary' => false]);
        $bank->update(['is_primary' => true]);
    }

    public function deleteBank(User $user, int $id): void
    {
        $bank = CustomerBankAccount::query()->where('user_id', $user->id)->findOrFail($id);
        $wasPrimary = $bank->is_primary;
        $bank->delete();
        if ($wasPrimary) {
            CustomerBankAccount::query()->where('user_id', $user->id)->orderBy('id')->first()?->update(['is_primary' => true]);
        }
    }

    /** @return array<string, mixed> */
    private function presentBank(CustomerBankAccount $b): array
    {
        return [
            'id' => $b->id, 'holder_name' => $b->holder_name, 'bank_name' => $b->bank_name,
            'account_masked' => 'XXXX XXXX '.$b->account_last4, 'ifsc' => $b->ifsc, 'account_type' => $b->account_type,
            'branch' => $b->branch, 'is_primary' => $b->is_primary, 'status' => $b->status,
            'added_at' => $b->created_at?->toIso8601String(),
        ];
    }

    // ── UPI ───────────────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function upiIds(User $user): array
    {
        return CustomerUpiId::query()->where('user_id', $user->id)->orderByDesc('is_primary')->orderBy('id')->get()
            ->map(fn (CustomerUpiId $u): array => [
                'id' => $u->id, 'vpa' => $u->vpa, 'app' => $this->upiApp($u->vpa), 'is_primary' => $u->is_primary,
                'status' => $u->status, 'added_at' => $u->created_at?->toIso8601String(),
            ])->all();
    }

    public function addUpi(User $user, string $vpa): CustomerUpiId
    {
        $vpa = strtolower(trim($vpa));
        if (CustomerUpiId::query()->where('user_id', $user->id)->count() >= self::MAX_UPI_IDS) {
            throw new DomainException('You can save up to '.self::MAX_UPI_IDS.' UPI IDs.', 422);
        }
        if (CustomerUpiId::query()->where('user_id', $user->id)->where('vpa', $vpa)->exists()) {
            throw new DomainException('This UPI ID is already saved.', 422, ['vpa' => ['This UPI ID is already saved.']]);
        }

        return CustomerUpiId::query()->create([
            'user_id' => $user->id, 'vpa' => $vpa, 'status' => 'unverified',
            'is_primary' => ! CustomerUpiId::query()->where('user_id', $user->id)->exists(),
        ]);
    }

    public function setPrimaryUpi(User $user, int $id): void
    {
        $upi = CustomerUpiId::query()->where('user_id', $user->id)->findOrFail($id);
        CustomerUpiId::query()->where('user_id', $user->id)->update(['is_primary' => false]);
        $upi->update(['is_primary' => true]);
    }

    public function deleteUpi(User $user, int $id): void
    {
        $upi = CustomerUpiId::query()->where('user_id', $user->id)->findOrFail($id);
        $wasPrimary = $upi->is_primary;
        $upi->delete();
        if ($wasPrimary) {
            CustomerUpiId::query()->where('user_id', $user->id)->orderBy('id')->first()?->update(['is_primary' => true]);
        }
    }

    private function upiApp(string $vpa): string
    {
        $handle = substr(strrchr($vpa, '@') ?: '', 1);

        return match (true) {
            in_array($handle, ['okaxis', 'okhdfcbank', 'okicici', 'oksbi'], true) => 'Google Pay',
            in_array($handle, ['ybl', 'ibl', 'axl'], true) => 'PhonePe',
            str_starts_with($handle, 'paytm') => 'Paytm',
            $handle === 'upi' => 'BHIM',
            default => 'UPI',
        };
    }

    // ── communication preferences ─────────────────────────────────────────────

    /** @return array<string, mixed> */
    public function communication(User $user): array
    {
        $p = $this->profile($user);
        $stored = (array) $p->communication_prefs;

        $events = [];
        foreach (self::NOTIFICATION_EVENTS as $e) {
            foreach (self::CHANNELS as $c) {
                $events[$e][$c] = (bool) ($stored['events'][$e][$c] ?? true);
            }
        }
        $marketing = [];
        foreach (self::MARKETING as $m) {
            $marketing[$m] = (bool) ($stored['marketing'][$m] ?? in_array($m, ['exclusive_offers', 'education_tips', 'festive_offers'], true));
        }

        return [
            'events' => $events,
            'marketing' => $marketing,
            'language' => $p->language,
            'quiet_hours' => [
                'enabled' => (bool) ($stored['quiet']['enabled'] ?? false),
                'start' => $stored['quiet']['start'] ?? '22:00',
                'end' => $stored['quiet']['end'] ?? '08:00',
            ],
        ];
    }

    /** @param array<string, mixed> $data */
    public function updateCommunication(User $user, array $data): array
    {
        $current = $this->communication($user);
        $p = $this->profile($user);

        $merged = [
            'events' => array_replace_recursive($current['events'], $data['events'] ?? []),
            'marketing' => array_replace($current['marketing'], $data['marketing'] ?? []),
            'quiet' => array_replace($current['quiet_hours'], $data['quiet_hours'] ?? []),
        ];
        $p->update([
            'communication_prefs' => $merged,
            'language' => $data['language'] ?? $p->language,
        ]);

        return $this->communication($user);
    }

    // ── security ──────────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function sessions(User $user, ?int $currentTokenId): array
    {
        return $user->tokens()->orderByDesc('last_used_at')->orderByDesc('id')->get()->map(fn ($t): array => [
            'id' => $t->id,
            'current' => $currentTokenId !== null && $t->id === $currentTokenId,
            'signed_in_at' => $t->created_at?->toIso8601String(),
            'last_used_at' => $t->last_used_at?->toIso8601String(),
        ])->all();
    }

    public function signOutOtherSessions(User $user, ?int $currentTokenId): int
    {
        return $user->tokens()->when($currentTokenId !== null, fn ($q) => $q->where('id', '!=', $currentTokenId))->delete();
    }

    // ── data request & closing the account ────────────────────────────────────

    /** @return array<string, mixed> A copy of the customer's own data (no secrets, no internal notes). */
    public function export(User $user): array
    {
        $customer = Customer::query()->where('user_id', $user->id)->first();
        $leads = $customer ? LoanLead::query()->whereIn('id', $customer->leads()->pluck('loan_leads.id'))->get() : collect();

        return [
            'exported_at' => now()->toIso8601String(),
            'account' => ['name' => $user->name, 'email' => $user->email, 'phone' => $user->phone],
            'profile' => collect($this->present($user))->except(['kyc'])->all(),
            'communication' => $this->communication($user),
            'kyc_documents' => $this->kycDocuments($user),
            'bank_accounts' => $this->bankAccounts($user),
            'upi_ids' => $this->upiIds($user),
            'applications' => $leads->map(fn (LoanLead $l): array => [
                'reference' => $l->reference, 'loan_type' => $l->loan_type, 'loan_amount' => (float) $l->loan_amount,
                'tenure_months' => $l->tenure_months, 'city' => $l->city, 'submitted_on' => $l->created_at?->toIso8601String(),
            ])->all(),
        ];
    }

    /** Loans that are still alive block account closure. */
    public function activeApplicationCount(User $user): int
    {
        $customer = Customer::query()->where('user_id', $user->id)->first();
        if ($customer === null) {
            return 0;
        }

        return LoanLead::query()
            ->whereIn('id', $customer->leads()->pluck('loan_leads.id'))
            ->whereNotIn('status', [LeadStatus::Closed->value, LeadStatus::Rejected->value])
            ->count();
    }

    public function requestDeletion(User $user, string $reason, ?string $comments): CustomerProfile
    {
        $active = $this->activeApplicationCount($user);
        if ($active > 0) {
            throw new DomainException(
                "You still have {$active} active loan application".($active === 1 ? '' : 's').'. Please close or complete them before asking us to delete your account.',
                422,
                ['account' => ['You have active loan applications.']],
            );
        }

        $p = $this->profile($user);
        $p->update(['deletion_requested_at' => now(), 'deletion_reason' => $reason, 'deletion_comments' => $comments]);

        return $p->refresh();
    }

    public function cancelDeletion(User $user): void
    {
        $this->profile($user)->update(['deletion_requested_at' => null, 'deletion_reason' => null, 'deletion_comments' => null]);
    }

    /** Switches the account off and signs it out everywhere. Support can switch it back on. */
    public function deactivate(User $user): void
    {
        $user->update(['is_active' => false]);
        $user->tokens()->delete();
    }
}
