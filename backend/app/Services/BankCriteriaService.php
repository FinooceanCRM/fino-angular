<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\User;
use App\Repositories\Contracts\BankCriteriaRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/** Bank criteria management (Phase 9). */
class BankCriteriaService extends BaseService
{
    public function __construct(
        private readonly BankCriteriaRepositoryInterface $criteria,
        private readonly NotificationService $notifications,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(User $actor, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        // A banker only ever manages their own criteria rows; everyone else
        // (read-only for the hierarchy, full access for Super Admin) sees all.
        if ($actor->roleEnum() === UserRole::Banker) {
            $filters['banker_id'] = $actor->id;
        }

        return $this->criteria->paginate($filters, $perPage);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(User $actor, array $attributes): BankCriteria
    {
        if ($actor->roleEnum() === UserRole::Banker) {
            $attributes['banker_id'] = $actor->id;
        }

        $created = $this->criteria->create($attributes);

        $recipientIds = User::query()
            ->whereIn('role', [UserRole::Manager->value, UserRole::Employee->value, UserRole::Connector->value])
            ->pluck('id')
            ->all();

        $this->notifications->notifyMany(
            $recipientIds,
            'bank_criteria.created',
            'New bank criteria submitted',
            sprintf('%s submitted new lending criteria for %s — %s.', $actor->name, $created->bank_name, $created->product_name),
            ['bank_criteria_id' => $created->id],
        );

        return $created;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(User $actor, BankCriteria $bank, array $attributes): BankCriteria
    {
        // A banker can never reassign ownership of their own criteria.
        if ($actor->roleEnum() === UserRole::Banker) {
            unset($attributes['banker_id']);
        }

        return $this->criteria->update($bank, $attributes);
    }

    public function delete(BankCriteria $bank): bool
    {
        return $this->criteria->delete($bank);
    }
}
