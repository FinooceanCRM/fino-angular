<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The `role` column on `users` is a real MySQL ENUM (see
 * 2024_01_01_000000_create_users_table.php) — adding the Accounts case to
 * App\Enums\UserRole does not by itself let the database accept 'accounts'.
 * This widens the column, same pattern as
 * 2026_08_24_000000_add_affiliate_role_to_users_table.php.
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
            array_values(array_filter(UserRole::values(), static fn (string $v): bool => $v !== UserRole::Accounts->value)),
        ));

        DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
    }
};
