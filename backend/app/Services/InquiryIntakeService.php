<?php

namespace App\Services;

use App\Enums\Department;
use App\Enums\InquirySource;
use App\Enums\InquiryStatus;
use App\Enums\LeadStatus;
use App\Enums\LoanType;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\InquiryActivity;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;

/**
 * Turns a website / customer-portal inquiry into a lead in the *existing*
 * `loan_leads` table (no parallel table), tagged with its source so the
 * Telecaller "Customer Inquiries" queue can pick it up.
 *
 * Duplicate handling is deliberate rather than silent:
 *  - the same idempotency key always resolves to the same lead;
 *  - an open inquiry for the same phone + loan type in the last 30 days is
 *    not re-created — the lead is flagged as re-submitted and the team notified;
 *  - customers are never matched/merged by unverified name or email; a lead is
 *    linked to a customer only when submitted from that customer's own
 *    authenticated session.
 */
class InquiryIntakeService extends BaseService
{
    public const DUPLICATE_WINDOW_DAYS = 30;

    public function __construct(
        private readonly NotificationService $notifications,
        private readonly CaptchaVerifierInterface $captcha,
        private readonly EligibilityService $eligibility,
    ) {
    }

    /**
     * @param array<string, mixed> $data validated request payload
     * @return array{lead: LoanLead, duplicate: bool}|null null when the honeypot caught a bot
     */
    public function submit(array $data, ?User $customerUser = null, ?string $ip = null): ?array
    {
        if (! empty($data['website'])) {
            return null;
        }

        // Captcha is enforced whenever a secret is configured. Without one
        // (local dev) the endpoint relies on throttling + honeypot only.
        if ($customerUser === null && filled(config('services.captcha.secret'))
            && ! $this->captcha->verify((string) ($data['captcha_token'] ?? ''), $ip)) {
            throw new DomainException('We could not verify your submission. Please try again.', 422);
        }

        $product = $this->resolveProduct($data);
        $loanType = LoanType::from($product['loan_type']);
        $phone = $this->normalisePhone((string) $data['applicant_phone']);
        $key = filled($data['idempotency_key'] ?? null) ? 'inq-'.substr(sha1((string) $data['idempotency_key']), 0, 40) : null;

        if ($key !== null && ($existing = LoanLead::query()->where('inquiry_key', $key)->first())) {
            return ['lead' => $existing, 'duplicate' => true];
        }

        $customer = $customerUser?->roleEnum() === UserRole::Customer
            ? Customer::query()->where('user_id', $customerUser->id)->first()
            : null;

        try {
            return $this->transaction(function () use ($data, $product, $loanType, $phone, $key, $customer, $customerUser): array {
                $open = LoanLead::query()
                    ->whereIn('source', InquirySource::inquiryValues())
                    ->where('applicant_phone', $phone)
                    ->where('loan_type', $loanType->value)
                    ->whereNotIn('status', [LeadStatus::Closed->value, LeadStatus::Rejected->value])
                    ->where('created_at', '>=', now()->subDays(self::DUPLICATE_WINDOW_DAYS))
                    // A signed-in customer can only collide with their own application, or one nobody owns yet
                    // (their earlier anonymous inquiry). Never another customer's: the same phone number can be
                    // shared, and the response would otherwise show them someone else's application.
                    ->when($customer !== null, fn ($q) => $q->where(
                        fn ($q) => $q->where('customer_id', $customer->id)->orWhereNull('customer_id'),
                    ))
                    ->lockForUpdate()
                    ->latest('id')
                    ->first();

                if ($open !== null) {
                    $this->recordResubmission($open, $customer);

                    return ['lead' => $open, 'duplicate' => true];
                }

                $eligibility = $this->eligibility->check([
                    'loan_type' => $loanType->value,
                    'loan_amount' => $data['loan_amount'],
                    'monthly_income' => $data['monthly_income'] ?? 0,
                    'existing_emi' => $data['existing_emi'] ?? 0,
                    'tenure_months' => $data['tenure_months'] ?? null,
                ]);

                $lead = LoanLead::query()->create([
                    'reference' => 'INQ-'.now()->format('ymd').'-'.strtoupper(Str::random(5)),
                    'applicant_name' => $data['applicant_name'],
                    'applicant_email' => $data['applicant_email'] ?? null,
                    'applicant_phone' => $phone,
                    'loan_type' => $loanType->value,
                    'department' => Department::fromLoanType($loanType)->value,
                    'loan_amount' => $data['loan_amount'],
                    'tenure_months' => $data['tenure_months'] ?? null,
                    'monthly_income' => $data['monthly_income'] ?? null,
                    'employment_type' => $data['employment_type'] ?? null,
                    'city' => $data['city'],
                    'status' => LeadStatus::New->value,
                    'source' => $customer !== null ? InquirySource::CustomerPortal->value : InquirySource::Website->value,
                    'customer_id' => $customer?->id,
                    'inquiry_status' => InquiryStatus::New->value,
                    'inquiry_key' => $key,
                    'details' => $this->extraDetails($data) + [
                        'product' => $product['slug'],
                        'product_name' => $product['name'],
                        'existing_emi' => $data['existing_emi'] ?? null,
                        'eligibility' => $eligibility,
                        'consent_at' => now()->toIso8601String(),
                    ],
                ]);

                if ($customer !== null) {
                    $customer->leads()->syncWithoutDetaching([$lead->id]);
                }

                LeadStatusHistory::query()->create([
                    'loan_lead_id' => $lead->id,
                    'from_status' => null,
                    'to_status' => LeadStatus::New->value,
                    'changed_by' => $customerUser?->id,
                    'remarks' => 'Inquiry submitted via '.InquirySource::from($lead->source)->label().'.',
                ]);

                InquiryActivity::query()->create([
                    'loan_lead_id' => $lead->id,
                    'user_id' => null,
                    'type' => 'created',
                    'body' => sprintf('%s inquiry received for %s.', InquirySource::from($lead->source)->label(), $product['name']),
                    'meta' => ['band' => $eligibility['band']],
                ]);

                $this->notifications->notifyMany(
                    $this->queueStaffIds(),
                    'inquiry.new',
                    'New customer inquiry',
                    sprintf('%s requested a %s (%s).', $lead->applicant_name, $product['name'], $lead->reference),
                    ['lead_id' => $lead->id],
                );

                if ($customerUser !== null) {
                    $this->notifications->notify(
                        $customerUser->id,
                        'customer.inquiry_received',
                        'Inquiry received',
                        sprintf('We received your %s request (%s). An advisor will contact you shortly.', $product['name'], $lead->reference),
                        ['lead_id' => $lead->id],
                    );
                }

                return ['lead' => $lead, 'duplicate' => false];
            });
        } catch (UniqueConstraintViolationException) {
            // Two identical submissions raced past the key lookup above.
            $existing = LoanLead::query()->where('inquiry_key', $key)->first();
            if ($existing === null) {
                throw new DomainException('Your inquiry could not be saved. Please try again.', 409);
            }

            return ['lead' => $existing, 'duplicate' => true];
        }
    }

    private function recordResubmission(LoanLead $lead, ?Customer $customer): void
    {
        $lead->increment('resubmission_count');

        // Only attach when the submitter is authenticated as that customer
        // *and* the lead has no owner yet — never take over another account's lead.
        if ($customer !== null && $lead->customer_id === null) {
            $lead->update(['customer_id' => $customer->id]);
            $customer->leads()->syncWithoutDetaching([$lead->id]);
        }

        InquiryActivity::query()->create([
            'loan_lead_id' => $lead->id,
            'user_id' => null,
            'type' => 'resubmission',
            'body' => 'The customer submitted this inquiry again.',
            'meta' => ['count' => $lead->resubmission_count],
        ]);

        $this->notifications->notifyMany(
            array_filter([$lead->assigned_telecaller_id]) ?: $this->queueStaffIds(),
            'inquiry.resubmitted',
            'Customer re-submitted an inquiry',
            sprintf('%s submitted %s again.', $lead->applicant_name, $lead->reference),
            ['lead_id' => $lead->id],
        );
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function resolveProduct(array $data): array
    {
        $products = collect(config('loan_products.products'));

        if (filled($data['product'] ?? null)) {
            $found = $products->firstWhere('slug', $data['product']);
            if ($found === null) {
                throw new DomainException('Unknown loan product.', 422, ['product' => ['Unknown loan product.']]);
            }

            return $found;
        }

        $found = $products->firstWhere('loan_type', $data['loan_type'] ?? null);
        if ($found === null) {
            throw new DomainException('Please choose a loan product.', 422, ['product' => ['Please choose a loan product.']]);
        }

        return $found;
    }

    /** Keeps the last 10 digits so +91 / 0-prefixed variants collapse to one number. */
    /** @return array<string, mixed> Extra answers supplied by the customer portal; empty for every other caller. */
    private function extraDetails(array $data): array
    {
        return is_array($data['extra_details'] ?? null) ? $data['extra_details'] : [];
    }

    private function normalisePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        return strlen($digits) > 10 ? substr($digits, -10) : $digits;
    }

    /** @return array<int, int> */
    private function queueStaffIds(): array
    {
        return User::query()
            ->whereIn('role', [UserRole::Telecaller->value, UserRole::SuperAdmin->value])
            ->where('is_active', true)
            ->pluck('id')
            ->all();
    }
}
