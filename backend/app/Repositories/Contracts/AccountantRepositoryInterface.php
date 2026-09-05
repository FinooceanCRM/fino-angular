<?php

namespace App\Repositories\Contracts;

use App\Models\Accountant;
use App\Models\User;

interface AccountantRepositoryInterface
{
    public function findByUser(User $user): ?Accountant;

    /** Returns the accounts profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Accountant;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Accountant $accountant, array $attributes): Accountant;
}
