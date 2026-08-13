<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly UserHierarchyService $hierarchy,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function listFor(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->users->paginateVisible($actor, $filters, $perPage);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(User $actor, array $attributes): User
    {
        $role = UserRole::from($attributes['role']);
        $this->assertRoleAssignable($actor, $role);

        $attributes = $this->applyHierarchyDefaults($actor, $role, $attributes);
        $attributes['password'] = Hash::make($attributes['password']);
        $attributes['email'] = mb_strtolower(trim($attributes['email']));
        $attributes['is_active'] = $attributes['is_active'] ?? true;

        return $this->transaction(fn (): User => $this->users->create($attributes));
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(User $actor, User $target, array $attributes): User
    {
        if (array_key_exists('role', $attributes) && $attributes['role'] !== null) {
            $role = UserRole::from($attributes['role']);
            $this->assertRoleAssignable($actor, $role);
            $attributes = $this->applyHierarchyDefaults($actor, $role, $attributes);
        } else {
            unset($attributes['role']);
        }

        if (! empty($attributes['password'])) {
            $attributes['password'] = Hash::make($attributes['password']);
        } else {
            unset($attributes['password']);
        }

        if (isset($attributes['email'])) {
            $attributes['email'] = mb_strtolower(trim($attributes['email']));
        }

        return $this->transaction(function () use ($target, $attributes): User {
            /** @var User $updated */
            $updated = $this->users->update($target->id, $attributes);

            return $updated;
        });
    }

    public function delete(User $target): bool
    {
        return $this->transaction(fn (): bool => $this->users->delete($target->id));
    }

    private function assertRoleAssignable(User $actor, UserRole $role): void
    {
        if (! in_array($role, $this->hierarchy->assignableRoles($actor), true)) {
            throw new DomainException(
                sprintf('You cannot assign the "%s" role.', $role->label()),
                403,
            );
        }
    }

    /**
     * Fills manager_id / relationship_manager_id so the new record always lands
     * inside the actor's own subtree.
     *
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function applyHierarchyDefaults(User $actor, UserRole $role, array $attributes): array
    {
        $attributes['role'] = $role->value;

        // Connectors are independent of the reporting hierarchy.
        if ($role === UserRole::Connector) {
            $attributes['manager_id'] = null;
            $attributes['relationship_manager_id'] = null;
            $attributes['employee_id'] = null;

            return $attributes;
        }

        $actorRole = $actor->roleEnum();

        if ($actorRole === UserRole::Manager) {
            $attributes['manager_id'] = $actor->id;
        }

        if ($actorRole === UserRole::RelationshipManager) {
            $attributes['manager_id'] = $actor->manager_id;
            $attributes['relationship_manager_id'] = $actor->id;
        }

        if ($role === UserRole::RelationshipManager) {
            $attributes['relationship_manager_id'] = null;
        }

        if ($role === UserRole::Manager) {
            $attributes['relationship_manager_id'] = null;
        }

        if ($role === UserRole::Employee && empty($attributes['relationship_manager_id'])) {
            throw new DomainException('An employee must be assigned to a relationship manager.', 422);
        }

        return $attributes;
    }
}
