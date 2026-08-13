<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

class EloquentUserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email): ?User
    {
        /** @var User|null $user */
        $user = $this->model->newQuery()
            ->where('email', mb_strtolower(trim($email)))
            ->first();

        return $user;
    }

    public function markLoggedIn(User $user): User
    {
        $user->touch();

        return $user;
    }

    /**
     * @param array<string, mixed> $filters
     */
    protected function query(array $filters = []): Builder
    {
        return $this->model->newQuery()
            ->when($filters['role'] ?? null, fn (Builder $q, string $role) => $q->where('role', $role))
            ->when(
                array_key_exists('is_active', $filters),
                fn (Builder $q) => $q->where('is_active', (bool) $filters['is_active']),
            );
    }
}
