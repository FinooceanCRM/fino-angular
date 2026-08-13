<?php

namespace App\Repositories;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\RelationshipManager;
use App\Models\User;
use App\Repositories\Contracts\RelationshipManagerRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentRelationshipManagerRepository implements RelationshipManagerRepositoryInterface
{
    public function findByUser(User $user): ?RelationshipManager
    {
        return RelationshipManager::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): RelationshipManager
    {
        $profile = RelationshipManager::query()->firstOrCreate(['user_id' => $user->id]);
        $profile->setRelation('user', $user);

        return $profile;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(RelationshipManager $profile, array $attributes): RelationshipManager
    {
        if ($attributes !== []) {
            $profile->fill($attributes)->save();
        }

        return $profile->refresh();
    }

    /**
     * @return Collection<int, User>
     */
    public function employeesFor(User $relationshipManager): Collection
    {
        return $this->employeeQuery($relationshipManager)
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, Connector>
     */
    public function connectorsFor(User $relationshipManager): Collection
    {
        return Connector::query()
            ->with('user')
            ->where('relationship_manager_id', $relationshipManager->id)
            ->whereHas('user', fn ($query) => $query->where('role', UserRole::Connector->value))
            ->get();
    }

    public function countEmployees(User $relationshipManager): int
    {
        return $this->employeeQuery($relationshipManager)->count();
    }

    public function countConnectors(User $relationshipManager): int
    {
        return Connector::query()
            ->where('relationship_manager_id', $relationshipManager->id)
            ->count();
    }

    private function employeeQuery(User $relationshipManager): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()
            ->where('role', UserRole::Employee->value)
            ->where('relationship_manager_id', $relationshipManager->id);
    }
}
