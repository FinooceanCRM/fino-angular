<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $permissionIds = [];

        foreach (['create', 'edit', 'delete'] as $action) {
            $slug = "banking.{$action}";

            DB::table('permissions')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => ucfirst($action).' Banking',
                    'group' => 'banking',
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );

            $permissionIds[$action] = DB::table('permissions')
                ->where('slug', $slug)
                ->value('id');
        }

        $bankerRoleId = DB::table('roles')->where('slug', 'banker')->value('id');

        if ($bankerRoleId === null) {
            return;
        }

        foreach ($permissionIds as $permissionId) {
            DB::table('permission_role')->insertOrIgnore([
                'role_id' => $bankerRoleId,
                'permission_id' => $permissionId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['banking.create', 'banking.edit', 'banking.delete'])
            ->pluck('id');

        DB::table('permission_role')
            ->whereIn('permission_id', $permissionIds)
            ->whereIn('role_id', DB::table('roles')->where('slug', 'banker')->pluck('id'))
            ->delete();
    }
};
