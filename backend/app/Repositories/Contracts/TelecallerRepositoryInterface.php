<?php

namespace App\Repositories\Contracts;

use App\Models\Telecaller;
use App\Models\User;

interface TelecallerRepositoryInterface
{
    public function findByUser(User $user): ?Telecaller;

    /** Returns the telecaller profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Telecaller;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Telecaller $telecaller, array $attributes): Telecaller;
}
