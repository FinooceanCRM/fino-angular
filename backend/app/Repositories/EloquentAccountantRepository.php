<?php

namespace App\Repositories;

use App\Models\Accountant;
use App\Models\User;
use App\Repositories\Contracts\AccountantRepositoryInterface;

class EloquentAccountantRepository implements AccountantRepositoryInterface
{
    public function findByUser(User $user): ?Accountant
    {
        return Accountant::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): Accountant
    {
        $accountant = Accountant::query()->firstOrCreate(['user_id' => $user->id]);
        $accountant->setRelation('user', $user);

        return $accountant;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Accountant $accountant, array $attributes): Accountant
    {
        $accountant->fill($attributes)->save();

        return $accountant->refresh();
    }
}
