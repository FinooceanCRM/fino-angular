<?php

namespace App\Repositories;

use App\Models\Connector;
use App\Models\User;
use App\Repositories\Contracts\ConnectorRepositoryInterface;

class EloquentConnectorRepository implements ConnectorRepositoryInterface
{
    public function findByUser(User $user): ?Connector
    {
        return Connector::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): Connector
    {
        $connector = Connector::query()->firstOrCreate(['user_id' => $user->id]);
        $connector->setRelation('user', $user);

        return $connector;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Connector $connector, array $attributes): Connector
    {
        $connector->fill($attributes)->save();

        return $connector->refresh();
    }
}
