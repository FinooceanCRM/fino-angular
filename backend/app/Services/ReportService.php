<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;

/**
 * Dashboard statistics per role (Phase 9). Every figure is derived from the
 * actor's visible lead scope, so no user ever sees data outside their subtree.
 */
class ReportService extends BaseService
{
    public function __construct(private readonly LoanLeadRepositoryInterface $leads)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(User $actor): array
    {
        $counts = $this->leads->statusCounts($actor);
        $total = array_sum($counts);

        $byStatus = [];
        foreach (LeadStatus::cases() as $status) {
            $byStatus[] = [
                'status' => $status->value,
                'label' => $status->label(),
                'count' => (int) ($counts[$status->value] ?? 0),
            ];
        }

        $payload = [
            'role' => $actor->roleEnum()->value,
            'totals' => [
                'leads' => $total,
                'approved' => (int) ($counts[LeadStatus::Approved->value] ?? 0),
                'rejected' => (int) ($counts[LeadStatus::Rejected->value] ?? 0),
                'disbursed' => (int) ($counts[LeadStatus::Disbursed->value] ?? 0),
                'in_progress' => (int) ($counts[LeadStatus::InProgress->value] ?? 0),
                'new' => (int) ($counts[LeadStatus::New->value] ?? 0),
            ],
            'by_status' => $byStatus,
            'recent_leads' => $this->leads->visibleQuery($actor)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(static fn ($lead): array => [
                    'id' => $lead->id,
                    'reference' => $lead->reference,
                    'applicant_name' => $lead->applicant_name,
                    'loan_amount' => (float) $lead->loan_amount,
                    'status' => $lead->statusEnum()->value,
                    'created_at' => optional($lead->created_at)->toIso8601String(),
                ])->all(),
        ];

        $payload['team'] = $this->teamCounts($actor);

        return $payload;
    }

    /**
     * @return array<string, int>
     */
    private function teamCounts(User $actor): array
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin => [
                'managers' => User::query()->where('role', UserRole::Manager->value)->count(),
                'relationship_managers' => User::query()->where('role', UserRole::RelationshipManager->value)->count(),
                'employees' => User::query()->where('role', UserRole::Employee->value)->count(),
                'connectors' => User::query()->where('role', UserRole::Connector->value)->count(),
            ],
            UserRole::Manager => [
                'relationship_managers' => User::query()
                    ->where('role', UserRole::RelationshipManager->value)
                    ->where('manager_id', $actor->id)->count(),
                'employees' => User::query()
                    ->where('role', UserRole::Employee->value)
                    ->where('manager_id', $actor->id)->count(),
            ],
            UserRole::RelationshipManager => [
                'employees' => User::query()
                    ->where('role', UserRole::Employee->value)
                    ->where('relationship_manager_id', $actor->id)->count(),
            ],
            default => [],
        };
    }
}
