<?php

namespace App\Repositories;

use App\Enums\UserRole;
use App\Models\Manager;
use App\Models\User;
use App\Repositories\Contracts\ManagerRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EloquentManagerRepository implements ManagerRepositoryInterface
{
    public function findByUser(User $user): ?Manager
    {
        return Manager::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): Manager
    {
        $profile = Manager::query()->firstOrCreate(['user_id' => $user->id]);
        $profile->setRelation('user', $user);

        return $profile;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Manager $profile, array $attributes): Manager
    {
        if ($attributes !== []) {
            $profile->fill($attributes)->save();
        }

        return $profile->refresh();
    }

    /**
     * @return Collection<int, User>
     */
    public function relationshipManagersFor(User $manager): Collection
    {
        return $this->relationshipManagerQuery($manager)->orderBy('name')->get();
    }

    /**
     * @return Collection<int, User>
     */
    public function employeesFor(User $manager): Collection
    {
        return $this->employeeQuery($manager)->orderBy('name')->get();
    }

    public function findOwnedRelationshipManager(User $manager, int $relationshipManagerId): ?User
    {
        return $this->relationshipManagerQuery($manager)
            ->whereKey($relationshipManagerId)
            ->first();
    }

    public function countRelationshipManagers(User $manager): int
    {
        return $this->relationshipManagerQuery($manager)->count();
    }

    public function countEmployees(User $manager): int
    {
        return $this->employeeQuery($manager)->count();
    }

    private function relationshipManagerQuery(User $manager): Builder
    {
        return User::query()
            ->where('role', UserRole::RelationshipManager->value)
            ->where('manager_id', $manager->id);
    }

    /**
     * Employees are visible only through the Manager's own Relationship
     * Managers — never by matching `manager_id` alone.
     */
    private function employeeQuery(User $manager): Builder
    {
        return User::query()
            ->where('role', UserRole::Employee->value)
            ->whereIn(
                'relationship_manager_id',
                $this->relationshipManagerQuery($manager)->select('id'),
            );
    }
}
