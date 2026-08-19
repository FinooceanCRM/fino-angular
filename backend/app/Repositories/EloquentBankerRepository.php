<?php

namespace App\Repositories;

use App\Models\Banker;
use App\Models\User;
use App\Repositories\Contracts\BankerRepositoryInterface;

class EloquentBankerRepository implements BankerRepositoryInterface
{
    public function findByUser(User $user): ?Banker
    {
        return Banker::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): Banker
    {
        $banker = Banker::query()->firstOrCreate(['user_id' => $user->id]);
        $banker->setRelation('user', $user);

        return $banker;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Banker $banker, array $attributes): Banker
    {
        $banker->fill($attributes)->save();

        return $banker->refresh();
    }
}
