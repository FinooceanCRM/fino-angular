<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The `role` column on `users` is a real MySQL ENUM (see
 * 2024_01_01_000000_create_users_table.php and, for precedent,
 * 2026_08_14_100100_add_banker_role_to_users_table.php) — adding the
 * Telecaller case to App\Enums\UserRole does not by itself let the
 * database accept 'telecaller'. This widens the column.
 */
return new class extends Migration
{
    public function up(): void
    {
        $values = implode(',', array_map(
            static fn (string $value): string => "'{$value}'",
            UserRole::values(),
        ));

        DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
    }

    public function down(): void
    {
        $values = implode(',', array_map(
            static fn (string $value): string => "'{$value}'",
            array_values(array_filter(UserRole::values(), static fn (string $v): bool => $v !== UserRole::Telecaller->value)),
        ));

        DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
    }
};
