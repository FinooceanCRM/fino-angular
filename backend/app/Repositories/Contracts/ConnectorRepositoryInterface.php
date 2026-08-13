<?php

namespace App\Repositories\Contracts;

use App\Models\Connector;
use App\Models\User;

interface ConnectorRepositoryInterface
{
    public function findByUser(User $user): ?Connector;

    /** Returns the connector profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Connector;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Connector $connector, array $attributes): Connector;
}
