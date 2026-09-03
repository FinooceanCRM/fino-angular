<?php

namespace App\Enums;

/**
 * Coarse-grained capabilities used by policies, middleware and the frontend.
 */
enum Permission: string
{
    case ViewUsers = 'users.view';
    case CreateUsers = 'users.create';
    case UpdateUsers = 'users.update';
    case DeleteUsers = 'users.delete';
    case ViewBanking = 'banking.view';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $p): string => $p->value, self::cases());
    }

    /**
     * Permissions granted to a role.
     *
     * @return array<int, self>
     */
    public static function forRole(UserRole $role): array
    {
        return match ($role) {
            UserRole::SuperAdmin => self::cases(),
            UserRole::Manager, UserRole::RelationshipManager => [
                self::ViewUsers,
                self::CreateUsers,
                self::UpdateUsers,
                self::ViewBanking,
            ],
            UserRole::Employee, UserRole::Banker, UserRole::Connector => [self::ViewBanking],
            default => [],
        };
    }

    public static function roleHas(UserRole $role, self $permission): bool
    {
        return in_array($permission, self::forRole($role), true);
    }
}
