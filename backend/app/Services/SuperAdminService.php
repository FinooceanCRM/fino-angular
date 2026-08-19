<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\LeadStatusHistory;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;

/**
 * Platform-wide dashboard for Super Admin. Every figure here is
 * deliberately unscoped — Super Admin is the only role that sees the
 * whole platform at once.
 */
class SuperAdminService extends BaseService
{
    public function __construct(private readonly LoanLeadRepositoryInterface $leads)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboardFor(User $actor): array
    {
        $statusCounts = $this->leads->statusCounts($actor);
        $activeLeads = array_sum($statusCounts) - (int) ($statusCounts[LeadStatus::Closed->value] ?? 0);

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$actor->name.'.',
                'message' => "Here's what's happening across the platform today.",
            ],
            'stats' => [
                'total_users' => User::query()->count(),
                'managers' => User::query()->where('role', UserRole::Manager->value)->count(),
                'active_leads' => $activeLeads,
                'partner_banks' => BankCriteria::query()->where('is_active', true)->count(),
            ],
            'users_by_role' => collect(UserRole::cases())->map(fn (UserRole $role): array => [
                'role' => $role->value,
                'label' => $role->label(),
                'count' => User::query()->where('role', $role->value)->count(),
            ])->all(),
            'recent_activity' => LeadStatusHistory::query()
                ->with(['loanLead:id,reference,applicant_name', 'changedBy:id,name'])
                ->latest('created_at')
                ->limit(8)
                ->get()
                ->map(static function (LeadStatusHistory $entry): array {
                    $status = $entry->to_status !== null ? LeadStatus::tryFrom($entry->to_status) : null;

                    return [
                        'id' => $entry->id,
                        'lead_reference' => $entry->loanLead?->reference,
                        'applicant_name' => $entry->loanLead?->applicant_name,
                        'status' => $entry->to_status,
                        'status_label' => $status?->label() ?? $entry->to_status,
                        'changed_by' => $entry->changedBy?->name,
                        'created_at' => optional($entry->created_at)->toIso8601String(),
                    ];
                })->all(),
        ];
    }
}
