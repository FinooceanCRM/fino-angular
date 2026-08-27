<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

/**
 * DB-backed replacement for the old `App\Enums\Permission::roleHas()` check.
 * Backs the `permission:<module>.<action>` middleware and the Super Admin
 * permissions matrix (Phase 0).
 */
class RolePermissionService extends BaseService
{
    /**
     * Fixed module/action catalogue. The single source of truth for both
     * {@see \Database\Seeders\RolePermissionSeeder} and the permissions
     * matrix served to the frontend.
     *
     * @return array<int, array{key: string, label: string, actions: array<int, string>}>
     */
    public static function modules(): array
    {
        return [
            ['key' => 'dashboard', 'label' => 'Dashboard', 'actions' => ['view']],
            ['key' => 'users', 'label' => 'Users', 'actions' => ['view', 'create', 'edit', 'delete']],
            ['key' => 'leads', 'label' => 'Leads', 'actions' => ['view', 'create', 'edit', 'delete']],
            ['key' => 'customers', 'label' => 'Customers', 'actions' => ['view', 'create', 'edit', 'delete']],
            ['key' => 'tasks', 'label' => 'Tasks', 'actions' => ['view', 'create', 'edit', 'delete']],
            ['key' => 'banking', 'label' => 'Banking', 'actions' => ['view', 'create', 'edit', 'delete']],
            ['key' => 'commissions', 'label' => 'Commissions', 'actions' => ['view', 'create', 'edit']],
            ['key' => 'reports', 'label' => 'Reports', 'actions' => ['view']],
            ['key' => 'notifications', 'label' => 'Notifications', 'actions' => ['view', 'edit']],
            ['key' => 'audit_logs', 'label' => 'Audit Logs', 'actions' => ['view']],
            ['key' => 'settings', 'label' => 'Settings', 'actions' => ['view', 'edit']],
        ];
    }

    /** Does this user's role have the given `module.action` permission? */
    public function roleHas(User $user, string $permissionSlug): bool
    {
        return Role::query()
            ->where('slug', $user->roleEnum()->value)
            ->whereHas('permissions', function ($query) use ($permissionSlug): void {
                $query->where('slug', $permissionSlug);
            })
            ->exists();
    }

    /**
     * The full matrix served to the Super Admin permissions page.
     *
     * @return array{roles: array<int, array<string, mixed>>, modules: array<int, array<string, mixed>>, grants: array<string, array<string, array<int, string>>>}
     */
    public function matrix(): array
    {
        $modules = self::modules();
        $roles = Role::query()->orderBy('level')->get(['id', 'slug', 'name']);

        $grants = [];
        foreach ($roles as $role) {
            $slugs = $role->permissions()->pluck('slug')->all();

            $byModule = [];
            foreach ($modules as $module) {
                $byModule[$module['key']] = array_values(array_filter(
                    $module['actions'],
                    static fn (string $action): bool => in_array($module['key'].'.'.$action, $slugs, true),
                ));
            }

            $grants[$role->slug] = $byModule;
        }

        return [
            'roles' => $roles->map(static fn (Role $role): array => [
                'id' => $role->id,
                'slug' => $role->slug,
                'name' => $role->name,
            ])->all(),
            'modules' => $modules,
            'grants' => $grants,
        ];
    }

    /**
     * Grants or revokes a single `module.action` permission for a role.
     *
     * @return array{role: Role, permission: Permission}
     */
    public function toggle(string $roleSlug, string $moduleKey, string $action, bool $grant): array
    {
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $permission = Permission::query()->where('slug', $moduleKey.'.'.$action)->firstOrFail();

        if ($grant) {
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        } else {
            $role->permissions()->detach($permission->id);
        }

        return ['role' => $role, 'permission' => $permission];
    }
}
