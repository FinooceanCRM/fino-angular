<?php

namespace App\Services;

use App\Enums\InquirySource;
use App\Enums\InquiryStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\ContactMessage;
use App\Models\Customer;
use App\Models\CustomerBankAccount;
use App\Models\CustomerKycDocument;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The Telecaller "verification desk": everything a customer submits that a person has to check before it is
 * trusted - documents uploaded on an application, KYC documents and bank accounts saved on the profile - plus the
 * website contact messages. Telecaller and Super Admin only; every other role is refused here as well as on the
 * route, the same defence-in-depth {@see InquiryQueueService} uses.
 */
class TelecallerVerificationService
{
    private const DISK = 'local';
    private const LIMIT = 100;

    public function __construct(
        private readonly DocumentService $documents,
        private readonly NotificationService $notifications,
    ) {
    }

    /** Active staff who work the queue; they are told whenever a customer adds something to verify. */
    public static function queueStaffIds(): array
    {
        return User::query()->whereIn('role', [UserRole::Telecaller->value, UserRole::SuperAdmin->value])
            ->where('is_active', true)->pluck('id')->all();
    }

    /** @return array<string, int> */
    public function summary(User $actor): array
    {
        $this->assertStaff($actor);

        return [
            'new_inquiries' => LoanLead::query()->whereIn('source', InquirySource::inquiryValues())
                ->where('inquiry_status', InquiryStatus::New->value)->count(),
            'documents' => $this->pendingDocuments()->count(),
            'kyc' => CustomerKycDocument::query()->where('status', 'pending')->count(),
            'bank_accounts' => CustomerBankAccount::query()->where('status', 'pending')->count(),
            'messages' => ContactMessage::query()->whereNull('handled_at')->count(),
        ];
    }

    // ── application documents ─────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function documents(User $actor): array
    {
        $this->assertStaff($actor);

        return $this->pendingDocuments()->with('loanLead:id,reference,applicant_name,applicant_phone,loan_type')
            ->oldest('id')->limit(self::LIMIT)->get()->map(fn (Document $d): array => [
                'id' => $d->id,
                'type' => $d->document_type,
                'file_name' => $d->original_name,
                'size_bytes' => $d->size_bytes,
                'uploaded_at' => $d->created_at?->toIso8601String(),
                'lead' => [
                    'id' => $d->loanLead?->id,
                    'reference' => $d->loanLead?->reference,
                    'applicant_name' => $d->loanLead?->applicant_name,
                    'applicant_phone' => $d->loanLead?->applicant_phone,
                ],
            ])->all();
    }

    public function document(User $actor, int $id): Document
    {
        $this->assertStaff($actor);

        return $this->pendingDocuments()->with('loanLead')->findOrFail($id);
    }

    public function verifyDocument(User $actor, int $id): Document
    {
        return $this->documents->verify($actor, $this->document($actor, $id));
    }

    public function rejectDocument(User $actor, int $id, string $reason): Document
    {
        return $this->documents->reject($actor, $this->document($actor, $id), $reason);
    }

    public function streamDocument(User $actor, int $id): StreamedResponse
    {
        return $this->documents->stream($this->document($actor, $id));
    }

    /** Documents still waiting for a decision, on applications that came in through the website or the customer portal. */
    private function pendingDocuments()
    {
        return Document::query()->where('status', 'pending')
            ->whereIn('loan_lead_id', LoanLead::query()->whereIn('source', InquirySource::inquiryValues())->select('id'));
    }

    // ── KYC documents ─────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function kyc(User $actor): array
    {
        $this->assertStaff($actor);

        $rows = CustomerKycDocument::query()->where('status', 'pending')->oldest('id')->limit(self::LIMIT)->get();
        $customers = $this->customerNames($rows->pluck('user_id')->all());

        return $rows->map(fn (CustomerKycDocument $d): array => [
            'id' => $d->id,
            'type' => $d->type,
            'label' => CustomerProfileService::KYC_TYPES[$d->type] ?? $d->type,
            'file_name' => $d->original_name,
            'reference' => $d->reference,
            'uploaded_at' => $d->created_at?->toIso8601String(),
            'customer' => $customers[$d->user_id] ?? ['name' => 'Customer', 'phone' => null],
        ])->all();
    }

    public function verifyKyc(User $actor, int $id): CustomerKycDocument
    {
        $doc = $this->pendingKyc($actor, $id);
        $doc->update(['status' => 'verified', 'remarks' => null]);

        $label = CustomerProfileService::KYC_TYPES[$doc->type] ?? 'Document';
        $this->notifications->notify($doc->user_id, 'kyc.verified', 'KYC document verified', $label.' has been verified.', ['kyc_id' => $doc->id]);

        return $doc->refresh();
    }

    public function rejectKyc(User $actor, int $id, string $reason): CustomerKycDocument
    {
        $doc = $this->pendingKyc($actor, $id);
        $doc->update(['status' => 'rejected', 'remarks' => $reason]);

        $label = CustomerProfileService::KYC_TYPES[$doc->type] ?? 'Document';
        $this->notifications->notify($doc->user_id, 'kyc.rejected', 'KYC document needs attention', $label.' was not accepted: '.$reason, ['kyc_id' => $doc->id]);

        return $doc->refresh();
    }

    public function streamKyc(User $actor, int $id): StreamedResponse
    {
        $doc = $this->pendingKyc($actor, $id);
        if (! Storage::disk(self::DISK)->exists($doc->path)) {
            throw new DomainException('The stored file is missing.', 404);
        }

        return Storage::disk(self::DISK)->download($doc->path, $doc->original_name);
    }

    private function pendingKyc(User $actor, int $id): CustomerKycDocument
    {
        $this->assertStaff($actor);

        return CustomerKycDocument::query()->where('status', 'pending')->findOrFail($id);
    }

    // ── bank accounts ─────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function banks(User $actor): array
    {
        $this->assertStaff($actor);

        $rows = CustomerBankAccount::query()->where('status', 'pending')->oldest('id')->limit(self::LIMIT)->get();
        $customers = $this->customerNames($rows->pluck('user_id')->all());

        return $rows->map(fn (CustomerBankAccount $b): array => [
            'id' => $b->id,
            'holder_name' => $b->holder_name,
            'bank_name' => $b->bank_name,
            'account_masked' => 'XXXXXX'.$b->account_last4,
            'ifsc' => $b->ifsc,
            'added_at' => $b->created_at?->toIso8601String(),
            'customer' => $customers[$b->user_id] ?? ['name' => 'Customer', 'phone' => null],
        ])->all();
    }

    public function verifyBank(User $actor, int $id): CustomerBankAccount
    {
        $this->assertStaff($actor);

        $bank = CustomerBankAccount::query()->where('status', 'pending')->findOrFail($id);
        $bank->update(['status' => 'verified']);
        $this->notifications->notify($bank->user_id, 'bank.verified', 'Bank account verified', $bank->bank_name.' account ending '.$bank->account_last4.' has been verified.', ['bank_id' => $bank->id]);

        return $bank->refresh();
    }

    // ── website contact messages ──────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function messages(User $actor): array
    {
        $this->assertStaff($actor);

        return ContactMessage::query()->whereNull('handled_at')->oldest('id')->limit(self::LIMIT)->get()
            ->map(fn (ContactMessage $m): array => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'phone' => $m->phone,
                'inquiry_type' => $m->inquiry_type,
                'message' => $m->message,
                'received_at' => $m->created_at?->toIso8601String(),
            ])->all();
    }

    public function handleMessage(User $actor, int $id): ContactMessage
    {
        $this->assertStaff($actor);

        $message = ContactMessage::query()->whereNull('handled_at')->findOrFail($id);
        $message->update(['handled_at' => now()]);

        return $message->refresh();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** @param array<int, int> $userIds @return array<int, array{name: string, phone: ?string}> */
    private function customerNames(array $userIds): array
    {
        return User::query()->whereIn('id', array_unique($userIds))->get(['id', 'name', 'phone'])
            ->mapWithKeys(fn (User $u): array => [$u->id => ['name' => $u->name, 'phone' => $u->phone]])->all();
    }

    private function assertStaff(User $actor): void
    {
        if (! $actor->is_active || ! in_array($actor->roleEnum(), [UserRole::Telecaller, UserRole::SuperAdmin], true)) {
            throw new DomainException('This resource is only available to telecallers.', 403);
        }
    }
}
