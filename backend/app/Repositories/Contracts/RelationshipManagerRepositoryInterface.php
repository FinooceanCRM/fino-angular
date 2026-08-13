<?php

namespace App\Repositories\Contracts;

use App\Models\RelationshipManager;
use App\Models\User;
use Illuminate\Support\Collection;

interface RelationshipManagerRepositoryInterface
{
    public function findByUser(User $user): ?RelationshipManager;

    /** Returns the RM profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): RelationshipManager;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(RelationshipManager $profile, array $attributes): RelationshipManager;

    /**
     * Employees assigned to the given Relationship Manager.
     *
     * @return Collection<int, User>
     */
    public function employeesFor(User $relationshipManager): Collection;

    /**
     * Connectors assigned to the given Relationship Manager.
     *
     * @return Collection<int, \App\Models\Connector>
     */
    public function connectorsFor(User $relationshipManager): Collection;

    public function countEmployees(User $relationshipManager): int;

    public function countConnectors(User $relationshipManager): int;
}
