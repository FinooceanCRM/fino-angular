<?php

namespace App\Services;

use App\Enums\Department;
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
        private readonly AuditLogService $auditLog,
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

        return $this->transaction(function () use ($actor, $attributes, $role): User {
            $created = $this->users->create($attributes);

            $this->auditLog->record(
                $actor,
                'Created',
                'User',
                $created->name,
                sprintf('%s created %s user %s.', $actor->name, $role->label(), $created->name),
                'user_creation',
                $created->id,
            );

            return $created;
        });
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(User $actor, User $target, array $attributes): User
    {
        $attributes = array_merge([
            'manager_id' => $target->manager_id,
            'relationship_manager_id' => $target->relationship_manager_id,
            'department' => $target->department?->value,
        ], $attributes);

        if (array_key_exists('role', $attributes) && $attributes['role'] !== null) {
            $role = UserRole::from($attributes['role']);
            $this->assertRoleAssignable($actor, $role);
        } else {
            unset($attributes['role']);
            $role = $target->roleEnum();
        }

        $attributes = $this->applyHierarchyDefaults($actor, $role, $attributes);

        if (! empty($attributes['password'])) {
            $attributes['password'] = Hash::make($attributes['password']);
        } else {
            unset($attributes['password']);
        }

        if (isset($attributes['email'])) {
            $attributes['email'] = mb_strtolower(trim($attributes['email']));
        }

        return $this->transaction(function () use ($actor, $target, $attributes): User {
            /** @var User $updated */
            $updated = $this->users->update($target->id, $attributes);

            $this->auditLog->record(
                $actor,
                'Updated',
                'User',
                $updated->name,
                sprintf('%s updated user %s.', $actor->name, $updated->name),
                'user_update',
                $updated->id,
            );

            return $updated;
        });
    }

    public function delete(User $actor, User $target): bool
    {
        return $this->transaction(function () use ($actor, $target): bool {
            $deleted = $this->users->delete($target->id);

            $this->auditLog->record(
                $actor,
                'Deactivated',
                'User',
                $target->name,
                sprintf('%s deactivated user %s.', $actor->name, $target->name),
                'user_update',
                $target->id,
            );

            return $deleted;
        });
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
        $attributes['employee_id'] = null;

        // Connectors and Bankers are independent of the reporting hierarchy
        // and of departments.
        if ($role === UserRole::Connector || $role === UserRole::Banker) {
            $attributes['manager_id'] = null;
            $attributes['relationship_manager_id'] = null;
            $attributes['employee_id'] = null;
            $attributes['department'] = null;

            return $attributes;
        }

        // Telecallers are independent of the reporting hierarchy too, but
        // (per the department matrix) still belong to exactly one
        // department, chosen explicitly at creation like a Manager's.
        if ($role === UserRole::Telecaller) {
            $attributes['manager_id'] = null;
            $attributes['relationship_manager_id'] = null;
            $attributes['employee_id'] = null;
            $attributes['department'] = $this->requireDepartment($attributes);

            return $attributes;
        }

        $actorRole = $actor->roleEnum();

        if ($actorRole === UserRole::Manager) {
            $attributes['manager_id'] = $actor->id;

            if ($role === UserRole::Employee) {
                $relationshipManagerId = isset($attributes['relationship_manager_id'])
                    ? (int) $attributes['relationship_manager_id']
                    : null;

                if ($relationshipManagerId === null
                    || ! $this->hierarchy->managerOwnsRelationshipManager($actor, $relationshipManagerId)) {
                    throw new DomainException('The relationship manager must report to the authenticated manager.', 422);
                }
            }
        }

        if ($actorRole === UserRole::RelationshipManager) {
            $attributes['manager_id'] = $actor->manager_id;
            $attributes['relationship_manager_id'] = $actor->id;
        }

        if ($role === UserRole::RelationshipManager) {
            $attributes['relationship_manager_id'] = null;
        }

        if ($role === UserRole::Manager) {
            if ($actorRole === UserRole::SuperAdmin) {
                $attributes['manager_id'] = $actor->id;
            }
            $attributes['relationship_manager_id'] = null;
        }

        if ($role === UserRole::RelationshipManager && $actorRole === UserRole::SuperAdmin) {
            $managerId = isset($attributes['manager_id']) ? (int) $attributes['manager_id'] : null;
            $managerIsValid = $managerId !== null && User::query()
                ->whereKey($managerId)
                ->where('role', UserRole::Manager->value)
                ->exists();

            if (! $managerIsValid) {
                throw new DomainException('A relationship manager must be assigned to a manager.', 422);
            }
        }

        if ($role === UserRole::Employee) {
            $managerId = isset($attributes['manager_id']) ? (int) $attributes['manager_id'] : null;
            $relationshipManagerId = isset($attributes['relationship_manager_id'])
                ? (int) $attributes['relationship_manager_id']
                : null;

            if (! $this->hierarchy->relationshipIsValid($managerId, $relationshipManagerId)) {
                throw new DomainException('An employee must be assigned to a relationship manager under the same manager.', 422);
            }
        }

        // Department lives at the Relationship Manager level, not the
        // Manager: one Manager oversees Personal Loan, Home Loan and
        // Mortgage Loan simultaneously, split across separate RMs (one RM
        // per department). A Manager therefore has no department of their
        // own (null); an RM's department is chosen explicitly at creation
        // (it is the entry point); an Employee inherits it from their RM.
        // manager_id / relationship_manager_id are already finalised and
        // validated above by this point.
        if ($role === UserRole::Manager) {
            $attributes['department'] = null;
        } elseif ($role === UserRole::RelationshipManager) {
            $attributes['department'] = $this->requireDepartment($attributes);
        } elseif ($role === UserRole::Employee) {
            $attributes['department'] = User::query()->find((int) $attributes['relationship_manager_id'])?->department?->value;
        }

        return $attributes;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    private function requireDepartment(array $attributes): string
    {
        $department = $attributes['department'] ?? null;

        if (! is_string($department) || Department::tryFrom($department) === null) {
            throw new DomainException('A department must be assigned.', 422);
        }

        return $department;
    }
}
