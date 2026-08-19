<?php

namespace App\Repositories;

use App\Models\Telecaller;
use App\Models\User;
use App\Repositories\Contracts\TelecallerRepositoryInterface;

class EloquentTelecallerRepository implements TelecallerRepositoryInterface
{
    public function findByUser(User $user): ?Telecaller
    {
        return Telecaller::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): Telecaller
    {
        $telecaller = Telecaller::query()->firstOrCreate(['user_id' => $user->id]);
        $telecaller->setRelation('user', $user);

        return $telecaller;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Telecaller $telecaller, array $attributes): Telecaller
    {
        $telecaller->fill($attributes)->save();

        return $telecaller->refresh();
    }
}
