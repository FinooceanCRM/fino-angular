<?php

namespace App\Repositories\Contracts;

use App\Models\Manager;
use App\Models\User;
use Illuminate\Support\Collection;

interface ManagerRepositoryInterface
{
    public function findByUser(User $user): ?Manager;

    /** Returns the Manager profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Manager;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Manager $profile, array $attributes): Manager;

    /**
     * Relationship Managers reporting to the given Manager.
     *
     * @return Collection<int, User>
     */
    public function relationshipManagersFor(User $manager): Collection;

    /**
     * Employees under the given Manager's Relationship Managers.
     *
     * @return Collection<int, User>
     */
    public function employeesFor(User $manager): Collection;

    /**
     * A single Relationship Manager owned by this Manager, or null.
     */
    public function findOwnedRelationshipManager(User $manager, int $relationshipManagerId): ?User;

    /**
     * A single Employee under this Manager's own Relationship Managers, or null.
     */
    public function findOwnedEmployee(User $manager, int $employeeId): ?User;

    public function countRelationshipManagers(User $manager): int;

    public function countEmployees(User $manager): int;
}
