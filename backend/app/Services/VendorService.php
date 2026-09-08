<?php

namespace App\Services;

use App\Enums\VendorCertificationStatus;
use App\Models\LoanLead;
use App\Models\User;
use App\Models\VendorCertification;
use Illuminate\Support\Str;

/**
 * Business rules for the Vendor module.
 *
 * Vendors are independent of the reporting hierarchy: no manager,
 * relationship manager or employee is involved in any of these operations.
 */
class VendorService extends BaseService
{
    /**
     * Vendor dashboard payload: a welcome card, the vendor's own identity /
     * account status, and headline counters.
     *
     * `certifications_total` counts the vendor's own submitted (non-draft)
     * certifications; `loan_requests_total` counts loan leads the vendor
     * submitted through "Request a Loan".
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $vendor = $user->vendor;
        $firstName = Str::of($user->name)->trim()->explode(' ')->first() ?: $user->name;

        $certificationsTotal = VendorCertification::query()
            ->where('vendor_id', $user->id)
            ->where('status', '!=', VendorCertificationStatus::Draft->value)
            ->count();

        $loanRequestsTotal = LoanLead::query()
            ->where('vendor_id', $user->id)
            ->count();

        return [
            'welcome' => [
                'headline' => "Welcome, {$firstName}",
                'message' => 'Create your Vendor Certification and request a loan from your dashboard.',
            ],
            'vendor' => [
                'name' => $user->name,
                'email' => $user->email,
                'business_name' => $vendor?->business_name,
                'status' => $vendor?->statusEnum()->value,
                'status_label' => $vendor?->statusEnum()->label(),
                'status_colour' => $vendor?->statusEnum()->colour(),
                'joined_at' => $vendor?->joined_at?->toIso8601String(),
            ],
            'stats' => [
                'certifications_total' => $certificationsTotal,
                'loan_requests_total' => $loanRequestsTotal,
            ],
        ];
    }
}
