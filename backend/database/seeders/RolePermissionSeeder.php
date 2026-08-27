<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Services\RolePermissionService;
use Illuminate\Database\Seeder;

/**
 * Seeds the `roles` / `permissions` / `permission_role` tables that back the
 * `permission:<module>.<action>` middleware and the Super Admin permissions
 * matrix (Phase 0). Idempotent: safe to re-run.
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            UserRole::SuperAdmin->value => 1,
            UserRole::Manager->value => 2,
            UserRole::RelationshipManager->value => 3,
            UserRole::Employee->value => 4,
            UserRole::Connector->value => 5,
            UserRole::Banker->value => 6,
            UserRole::Telecaller->value => 7,
            UserRole::Affiliate->value => 8,
        ];

        foreach (UserRole::cases() as $role) {
            Role::query()->updateOrCreate(
                ['slug' => $role->value],
                [
                    'name' => $role->label(),
                    'level' => $levels[$role->value],
                    'description' => $role->label().' role',
                ],
            );
        }

        $modules = RolePermissionService::modules();

        $permissionsBySlug = [];
        foreach ($modules as $module) {
            foreach ($module['actions'] as $action) {
                $slug = $module['key'].'.'.$action;

                $permissionsBySlug[$slug] = Permission::query()->updateOrCreate(
                    ['slug' => $slug],
                    ['name' => ucfirst($action).' '.$module['label'], 'group' => $module['key']],
                );
            }
        }

        $modulesByKey = collect($modules)->keyBy('key');

        // Default grants (adapted from the mock's ROLE_MODULE_ACCESS intent).
        // 'manage' = every action the module defines; 'manage_except_delete'
        // = every action except delete; 'view' = the view action only.
        $grantSpecs = [
            UserRole::SuperAdmin->value => ['*' => 'manage'],
            UserRole::Manager->value => [
                'users' => 'manage',
                'leads' => 'manage',
                'customers' => 'manage',
                'tasks' => 'manage',
                'banking' => 'manage',
                'commissions' => 'manage',
                'notifications' => 'manage',
                'dashboard' => 'view',
                'reports' => 'view',
                'audit_logs' => 'view',
                'settings' => 'view',
            ],
            UserRole::RelationshipManager->value => [
                'leads' => 'manage',
                'customers' => 'manage',
                'tasks' => 'manage',
                'users' => 'manage_except_delete',
                'dashboard' => 'view',
                'banking' => 'view',
                'commissions' => 'view',
                'reports' => 'view',
                'notifications' => 'view',
            ],
            UserRole::Employee->value => [
                'leads' => 'manage_except_delete',
                // Customers module (Phase 3): usable by every role, but
                // customers.delete stays limited to super_admin/manager/
                // relationship_manager, so every non-hierarchy role below
                // gets 'manage_except_delete' (view/create/edit only).
                'customers' => 'manage_except_delete',
                'tasks' => 'manage_except_delete',
                'dashboard' => 'view',
                'notifications' => 'view',
            ],
            // Connector: brief's default is dashboard/commissions view only,
            // but Connectors already self-submit referral leads for real
            // (LeadService::create() assigns connector_id) and list their
            // own via GET /leads — leads.view/create are added so the new
            // coarse gate doesn't regress that pre-existing behaviour.
            UserRole::Connector->value => [
                'dashboard' => 'view',
                'commissions' => 'view',
                'leads' => ['view', 'create'],
                'customers' => 'manage_except_delete',
                'tasks' => 'manage_except_delete',
                'notifications' => 'view',
            ],
            UserRole::Banker->value => [
                'banking' => 'manage',
                'dashboard' => 'view',
                'leads' => 'view',
                'customers' => 'manage_except_delete',
                'tasks' => 'manage_except_delete',
                'notifications' => 'view',
            ],
            // Telecaller: brief's default is dashboard/leads view only, but
            // Telecallers already run the real PD workflow (submit PD,
            // complete PD, change status on their own leads) — leads.edit is
            // added so the coarse gate doesn't regress that.
            UserRole::Telecaller->value => [
                'dashboard' => 'view',
                'leads' => ['view', 'edit'],
                'customers' => 'manage_except_delete',
                'tasks' => 'manage_except_delete',
                'notifications' => 'view',
            ],
            UserRole::Affiliate->value => [
                'dashboard' => 'view',
                'commissions' => 'view',
                'customers' => 'manage_except_delete',
                'tasks' => 'manage_except_delete',
                'notifications' => 'view',
            ],
        ];

        foreach ($grantSpecs as $roleSlug => $spec) {
            $role = Role::query()->where('slug', $roleSlug)->first();

            if ($role === null) {
                continue;
            }

            if (($spec['*'] ?? null) === 'manage') {
                $role->permissions()->sync(array_map(
                    static fn (Permission $permission): int => $permission->id,
                    array_values($permissionsBySlug),
                ));

                continue;
            }

            $permissionIds = [];
            foreach ($spec as $moduleKey => $level) {
                $actions = $modulesByKey[$moduleKey]['actions'] ?? [];

                $allowed = is_array($level) ? $level : match ($level) {
                    'manage' => $actions,
                    'manage_except_delete' => array_values(array_diff($actions, ['delete'])),
                    'view' => ['view'],
                    default => [],
                };

                foreach ($allowed as $action) {
                    $slug = $moduleKey.'.'.$action;
                    if (isset($permissionsBySlug[$slug])) {
                        $permissionIds[] = $permissionsBySlug[$slug]->id;
                    }
                }
            }

            $role->permissions()->sync($permissionIds);
        }
    }
}
