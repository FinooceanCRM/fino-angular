<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The `role` column on `users` is a real MySQL ENUM (see
 * 2024_01_01_000000_create_users_table.php and, for precedent,
 * 2026_09_05_000000_add_accounts_role_to_users_table.php) — adding the
 * Vendor case to App\Enums\UserRole does not by itself let the database
 * accept 'vendor'. This widens the column.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $values = implode(',', array_map(
            static fn (string $value): string => "'{$value}'",
            UserRole::values(),
        ));

        DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $values = implode(',', array_map(
            static fn (string $value): string => "'{$value}'",
            array_values(array_filter(UserRole::values(), static fn (string $v): bool => $v !== UserRole::Vendor->value)),
        ));

        DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
    }
};
