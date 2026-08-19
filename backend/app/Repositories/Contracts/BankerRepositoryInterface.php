<?php

namespace App\Repositories\Contracts;

use App\Models\Banker;
use App\Models\User;

interface BankerRepositoryInterface
{
    public function findByUser(User $user): ?Banker;

    /** Returns the banker profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Banker;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Banker $banker, array $attributes): Banker;
}
