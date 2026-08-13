<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

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

        $groups = [
            'leads' => ['view', 'create', 'update', 'delete', 'assign'],
            'users' => ['view', 'create', 'update', 'delete'],
            'documents' => ['view', 'upload', 'delete'],
            'bank_criteria' => ['view', 'create', 'update', 'delete'],
            'notifications' => ['view'],
        ];

        foreach ($groups as $group => $actions) {
            foreach ($actions as $action) {
                Permission::query()->updateOrCreate(
                    ['slug' => $group.'.'.$action],
                    ['name' => ucfirst($action).' '.str_replace('_', ' ', $group), 'group' => $group],
                );
            }
        }

        $superAdmin = Role::query()->where('slug', UserRole::SuperAdmin->value)->first();
        $superAdmin?->permissions()->sync(Permission::query()->pluck('id'));
    }
}
