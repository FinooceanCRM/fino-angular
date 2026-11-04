<?php

namespace App\Services;

use App\Enums\LoanType;
use App\Exceptions\DomainException;
use App\Models\Document;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\User;
use App\Support\CustomerFacingStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;

/**
 * Everything a logged-in customer may read or do. Every query is scoped by
 * the authenticated customer's own `customers.id`; an id belonging to anyone
 * else is indistinguishable from a missing one (404), so ids can't be probed.
 */
class CustomerPortalService extends BaseService
{
    /** Extra documents a customer may add (shown as optional in the checklist). */
    public const OPTIONAL_DOCUMENTS = [
        'address_proof' => 'Address Proof',
        'property_documents' => 'Property Documents',
        'other' => 'Other Document',
    ];

    /** Documents a customer is asked for on every application. */
    public const REQUIRED_DOCUMENTS = [
        'aadhaar' => 'Aadhaar Card',
        'pan' => 'PAN Card',
        'income_proof' => 'Income Proof',
        'bank_statement' => 'Bank Statement',
    ];

    public function __construct(
        private readonly CustomerAuthService $accounts,
        private readonly InquiryIntakeService $intake,
        private readonly DocumentService $documents,
        private readonly NotificationService $notifications,
        private readonly PhoneOtpService $otp,
        private readonly CustomerProfileService $profiles,
    ) {
    }

    private function customerId(User $user): int
    {
        return $this->accounts->customerFor($user)->id;
    }

    public function applications(User $user, ?string $statusKey, int $perPage = 10): LengthAwarePaginator
    {
        $q = LoanLead::query()->where('customer_id', $this->customerId($user))->latest('id');

        return $q->paginate($perPage);
    }

    public function findOwned(User $user, int $leadId): LoanLead
    {
        return LoanLead::query()
            ->where('customer_id', $this->customerId($user))
            ->findOrFail($leadId);
    }

    /**
     * Apply from the logged-in portal. Same intake as the public form, but
     * forced onto the customer's own account.
     *
     * @param array<string, mixed> $data
     * @return array{lead: LoanLead, duplicate: bool}
     */
    public function apply(User $user, array $data): array
    {
        $customer = $this->accounts->customerFor($user);
        $data['applicant_name'] = trim((string) ($data['applicant_name'] ?? '')) ?: $user->name;
        $data['applicant_email'] = trim((string) ($data['applicant_email'] ?? '')) ?: $user->email;
        $data['applicant_phone'] = $data['applicant_phone'] ?? $customer->phone;
        $data['extra_details'] = $this->extraDetails($user, $data);
        $aadhaar = isset($data['applicant']['aadhaar']) ? (string) $data['applicant']['aadhaar'] : null;
        unset($data['applicant']['aadhaar']);

        $result = $this->intake->submit($data, $user);
        if ($result === null) {
            throw new DomainException('Your application could not be saved.', 422);
        }

        $this->profiles->rememberFromApplication($user, $data, $aadhaar, (bool) ($data['update_profile'] ?? false));

        return $result;
    }

    /**
     * Extra answers from the step-by-step application, kept on the lead's `details`.
     * The Aadhaar number is never stored in full - only its last four digits.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function extraDetails(User $user, array $data): array
    {
        $extra = [];

        if (! empty($data['applicant'])) {
            $a = $data['applicant'];
            $extra['applicant'] = array_filter([
                'dob' => $a['dob'] ?? null,
                'gender' => $a['gender'] ?? null,
                'marital_status' => $a['marital_status'] ?? null,
                'pan' => $a['pan'] ?? null,
                'aadhaar_last4' => isset($a['aadhaar']) ? substr((string) $a['aadhaar'], -4) : null,
            ], static fn ($v) => $v !== null && $v !== '');
        }
        if (! empty($data['employment'])) {
            $extra['employment'] = array_filter($data['employment'], static fn ($v) => $v !== null && $v !== '');
        }
        if (! empty($data['loan'])) {
            $extra['loan'] = array_filter($data['loan'], static fn ($v) => $v !== null && $v !== '');
        }
        if ($this->otp->consume($user, (string) ($data['applicant_phone'] ?? ''), $data['otp_token'] ?? null)) {
            $extra['phone_verified_at'] = now()->toIso8601String();
        }

        return $extra;
    }

    /**
     * Safe, customer-facing view of an application. Nothing here comes from
     * internal remarks, assignees, notes, PD data or underwriting fields.
     *
     * @return array<string, mixed>
     */
    public function present(LoanLead $lead, bool $detailed = false): array
    {
        $status = CustomerFacingStatus::for($lead->statusEnum());
        $details = (array) $lead->details;
        $loanType = LoanType::tryFrom((string) $lead->loan_type);

        $view = [
            'id' => $lead->id,
            'reference' => $lead->reference,
            'loan_type' => $lead->loan_type,
            'loan_type_label' => $details['product_name'] ?? $loanType?->label() ?? (string) $lead->loan_type,
            'loan_amount' => (float) $lead->loan_amount,
            'tenure_months' => $lead->tenure_months,
            'city' => $lead->city,
            'applied_on' => $lead->created_at?->toIso8601String(),
            'updated_at' => $lead->updated_at?->toIso8601String(),
            'status' => $status,
        ];

        if (! $detailed) {
            return $view;
        }

        $uploaded = Document::query()->where('loan_lead_id', $lead->id)->orderByDesc('id')->get()->groupBy('document_type');

        $view['steps'] = CustomerFacingStatus::steps();
        $view['documents'] = collect(self::REQUIRED_DOCUMENTS + self::OPTIONAL_DOCUMENTS)->map(function (string $label, string $type) use ($uploaded): array {
            /** @var Document|null $latest */
            $latest = $uploaded->get($type)?->first();

            return [
                'type' => $type,
                'label' => $label,
                'required' => array_key_exists($type, self::REQUIRED_DOCUMENTS),
                'status' => $latest?->status ?? 'not_uploaded',
                'document_id' => $latest?->id,
                'file_name' => $latest?->original_name,
                // Rejection reason is written for the customer by the reviewer.
                'remarks' => $latest?->status === 'rejected' ? $latest->remarks : null,
                'uploaded_at' => $latest?->created_at?->toIso8601String(),
            ];
        })->values()->all();

        $view['timeline'] = LeadStatusHistory::query()
            ->where('loan_lead_id', $lead->id)->orderBy('id')->get()
            ->map(function (LeadStatusHistory $h): array {
                $s = CustomerFacingStatus::for(\App\Enums\LeadStatus::from((string) $h->to_status));

                return ['label' => $s['label'], 'message' => $s['message'], 'at' => $h->created_at?->toIso8601String()];
            })->values()->all();

        $view['details'] = array_filter([
            'employment_type' => $lead->employment_type,
            'monthly_income' => $lead->monthly_income !== null ? (float) $lead->monthly_income : null,
        ], static fn ($v): bool => $v !== null);

        return $view;
    }

    /** @return array<string, mixed> */
    public function dashboard(User $user): array
    {
        $customer = $this->accounts->customerFor($user);
        $leads = LoanLead::query()->where('customer_id', $customer->id)->latest('id')->get();

        $pending = [];
        foreach ($leads as $lead) {
            $view = CustomerFacingStatus::for($lead->statusEnum());
            $have = Document::query()->where('loan_lead_id', $lead->id)->whereIn('status', ['pending', 'verified'])->pluck('document_type')->all();
            $missing = array_values(array_diff(array_keys(self::REQUIRED_DOCUMENTS), $have));
            $rejected = Document::query()->where('loan_lead_id', $lead->id)->where('status', 'rejected')->exists();

            if ($view['action_required'] || $rejected) {
                $pending[] = [
                    'lead_id' => $lead->id,
                    'reference' => $lead->reference,
                    'message' => $rejected ? 'A document was not accepted — please upload it again.' : 'Upload the requested documents.',
                    'missing_documents' => array_map(static fn (string $t): string => self::REQUIRED_DOCUMENTS[$t], $missing),
                ];
            }
        }

        $profileSteps = [
            ['key' => 'basic', 'label' => 'Basic Information', 'done' => filled($user->name) && filled($user->phone)],
            ['key' => 'kyc', 'label' => 'KYC Documents', 'done' => Document::query()->whereIn('loan_lead_id', $leads->pluck('id'))->where('status', 'verified')->exists()],
            ['key' => 'application', 'label' => 'First Application', 'done' => $leads->isNotEmpty()],
        ];

        return [
            'name' => $user->name,
            'counts' => [
                'total' => $leads->count(),
                'active' => $leads->filter(fn (LoanLead $l): bool => CustomerFacingStatus::for($l->statusEnum())['step'] < 4)->count(),
                'completed' => $leads->filter(fn (LoanLead $l): bool => CustomerFacingStatus::for($l->statusEnum())['step'] >= 4)->count(),
            ],
            'recent_applications' => $leads->take(3)->map(fn (LoanLead $l): array => $this->present($l))->values()->all(),
            'pending_actions' => $pending,
            'profile_completion' => [
                'percent' => (int) round(collect($profileSteps)->where('done', true)->count() / count($profileSteps) * 100),
                'steps' => $profileSteps,
            ],
            'unread_notifications' => $this->notifications->unreadCount($user),
        ];
    }

    /**
     * Upload (or replace) a required document on the customer's own application.
     */
    public function uploadDocument(User $user, int $leadId, string $type, UploadedFile $file): Document
    {
        if (! array_key_exists($type, self::REQUIRED_DOCUMENTS + self::OPTIONAL_DOCUMENTS)) {
            throw new DomainException('Unsupported document type.', 422, ['document_type' => ['Unsupported document type.']]);
        }

        $lead = $this->findOwned($user, $leadId);

        if ($lead->statusEnum()->isTerminal()) {
            throw new DomainException('This application is closed and no longer accepts documents.', 422);
        }

        // A verified document is final — customers cannot overwrite it.
        $latest = Document::query()->where('loan_lead_id', $lead->id)->where('document_type', $type)->latest('id')->first();
        if ($latest?->status === 'verified') {
            throw new DomainException('This document has already been verified.', 422);
        }

        return $this->transaction(function () use ($user, $lead, $type, $file, $latest): Document {
            $document = $this->documents->upload($user, $lead, $file, $type);

            $this->notifications->notifyMany(
                TelecallerVerificationService::queueStaffIds(),
                'document.uploaded',
                'Document to verify',
                sprintf('%s uploaded a document on %s.', $user->name, $lead->reference),
                ['document_id' => $document->id, 'lead_id' => $lead->id],
            );

            // Replacing a rejected/pending upload: drop the superseded file.
            if ($latest !== null) {
                $this->documents->delete($latest);
            }

            return $document;
        });
    }

    public function findOwnedDocument(User $user, int $documentId): Document
    {
        return Document::query()
            ->whereIn('loan_lead_id', LoanLead::query()->where('customer_id', $this->customerId($user))->select('id'))
            ->findOrFail($documentId);
    }

    /** @return array<int, array<string, mixed>> */
    public function allDocuments(User $user): array
    {
        $docs = Document::query()
            ->with('loanLead:id,reference,loan_type')
            ->whereIn('loan_lead_id', LoanLead::query()->where('customer_id', $this->customerId($user))->select('id'))
            ->latest('id')->get();

        return $docs->map(fn (Document $d): array => [
            'id' => $d->id,
            'lead_id' => $d->loan_lead_id,
            'reference' => $d->loanLead?->reference,
            'type' => $d->document_type,
            'label' => (self::REQUIRED_DOCUMENTS + self::OPTIONAL_DOCUMENTS)[$d->document_type] ?? ucfirst(str_replace('_', ' ', (string) $d->document_type)),
            'file_name' => $d->original_name,
            'status' => $d->status,
            'remarks' => $d->status === 'rejected' ? $d->remarks : null,
            'uploaded_at' => $d->created_at?->toIso8601String(),
        ])->all();
    }
}
