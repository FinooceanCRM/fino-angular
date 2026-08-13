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
        $user->forceFill(['last_login_at' => now()]);

        if ($user->isDirty('last_login_at') && \Illuminate\Support\Facades\Schema::hasColumn('users', 'last_login_at')) {
            $user->save();
        }

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
