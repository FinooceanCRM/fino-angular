<?php

namespace App\Services;

use App\Enums\LoanType;
use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use Illuminate\Support\Collection;

/**
 * Global search (Phase 1) — a derived, read-only index over Leads and Users,
 * scoped to the searching actor's own visibility exactly like the Leads and
 * Users list pages (reuses {@see LoanLeadRepositoryInterface::visibleQuery()}
 * and {@see UserHierarchyService::scopeVisible()}). No new table: replicates
 * `frontend/.../data/providers/global-search.provider.ts` field-for-field.
 */
class SearchService extends BaseService
{
    private const MAX_RESULTS = 50;

    /** Mirrors the mock's `USER_ROLE_TYPE`. */
    private const USER_ROLE_TYPE = [
        'manager' => 'user',
        'relationship_manager' => 'user',
        'employee' => 'employee',
        'connector' => 'connector',
        'banker' => 'banker',
    ];

    /** Mirrors the mock's `USER_ROUTE_SEGMENT`. */
    private const USER_ROUTE_SEGMENT = [
        'manager' => 'managers',
        'relationship_manager' => 'relationship-managers',
        'employee' => 'employees',
        'connector' => 'connectors',
        'banker' => 'bankers',
    ];

    /** Mirrors the mock's `USER_ICON`. */
    private const USER_ICON = [
        'manager' => 'supervisor_account',
        'relationship_manager' => 'support_agent',
        'employee' => 'badge',
        'connector' => 'hub',
        'banker' => 'account_balance',
    ];

    public function __construct(
        private readonly LoanLeadRepositoryInterface $leads,
        private readonly UserHierarchyService $hierarchy,
    ) {
    }

    /**
     * @param array<int, string>|null $types
     * @return array<int, array<string, mixed>>
     */
    public function search(User $actor, string $term, ?array $types = null): array
    {
        $results = $this->buildIndex($actor, $term);

        if ($types !== null && $types !== []) {
            $results = array_values(array_filter(
                $results,
                static fn (array $r): bool => in_array($r['type'], $types, true),
            ));
        }

        return array_slice($results, 0, self::MAX_RESULTS);
    }

    /**
     * @return array<string, int>
     */
    public function countsByType(User $actor, string $term): array
    {
        $results = $this->buildIndex($actor, $term);

        $counts = ['lead' => 0, 'user' => 0, 'employee' => 0, 'connector' => 0, 'banker' => 0];
        foreach ($results as $result) {
            $counts[$result['type']] = ($counts[$result['type']] ?? 0) + 1;
        }

        return $counts;
    }

    /**
     * Every visible lead/user matching the term, ranked and sorted — the
     * shared computation behind both `search()` and `countsByType()`.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildIndex(User $actor, string $term): array
    {
        $query = mb_strtolower(trim($term));
        if ($query === '') {
            return [];
        }

        $results = [
            ...$this->searchLeads($actor, $query),
            ...$this->searchUsers($actor, $query),
        ];

        usort($results, static function (array $a, array $b) use ($query): int {
            $rankDiff = self::rank($a, $query) <=> self::rank($b, $query);

            return $rankDiff !== 0 ? $rankDiff : strcasecmp($a['title'], $b['title']);
        });

        return $results;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchLeads(User $actor, string $query): array
    {
        $like = '%'.$query.'%';

        /** @var Collection<int, LoanLead> $leads */
        $leads = $this->leads->visibleQuery($actor)
            ->where(function ($q) use ($like): void {
                $q->where('applicant_name', 'like', $like)
                    ->orWhere('reference', 'like', $like)
                    ->orWhere('applicant_phone', 'like', $like)
                    ->orWhere('applicant_email', 'like', $like);
            })
            ->get();

        return $leads->map(static function (LoanLead $lead): array {
            return [
                'id' => 'lead-'.$lead->id,
                'type' => 'lead',
                'title' => $lead->applicant_name,
                'subtitle' => $lead->reference.' · '.LoanType::from($lead->loan_type)->label(),
                'meta' => $lead->statusEnum()->label(),
                'icon' => 'assignment',
                'route' => ['/super-admin/leads', (string) $lead->id],
                'query_params' => null,
            ];
        })->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchUsers(User $actor, string $query): array
    {
        $like = '%'.$query.'%';

        $users = $this->hierarchy->scopeVisible(User::query(), $actor)
            ->where(function ($q) use ($like): void {
                $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('phone', 'like', $like);
            })
            ->get();

        $mapped = [];
        foreach ($users as $user) {
            $roleValue = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
            $type = self::USER_ROLE_TYPE[$roleValue] ?? null;
            $segment = self::USER_ROUTE_SEGMENT[$roleValue] ?? null;

            if ($type === null || $segment === null) {
                continue;
            }

            $roleLabel = $user->roleEnum()->label();

            $mapped[] = [
                'id' => 'user-'.$user->id,
                'type' => $type,
                'title' => $user->name,
                'subtitle' => $user->email,
                'meta' => $user->is_active ? $roleLabel : $roleLabel.' · Inactive',
                'icon' => self::USER_ICON[$roleValue] ?? 'person',
                'route' => ['/super-admin/users', $segment],
                'query_params' => ['search' => $user->email],
            ];
        }

        return $mapped;
    }

    /**
     * Ranks a title match ahead of a match found only in the subtitle/keywords.
     *
     * @param array<string, mixed> $result
     */
    private static function rank(array $result, string $query): int
    {
        $title = mb_strtolower($result['title']);
        if (str_starts_with($title, $query)) {
            return 0;
        }
        if (str_contains($title, $query)) {
            return 1;
        }
        if (str_contains(mb_strtolower($result['subtitle']), $query)) {
            return 2;
        }

        return 3;
    }
}
