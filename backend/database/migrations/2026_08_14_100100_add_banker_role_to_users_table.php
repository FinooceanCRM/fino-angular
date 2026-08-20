<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The `role` column on `users` is a real MySQL ENUM (see
 * 2024_01_01_000000_create_users_table.php), not just an app-level
 * constraint — adding the Banker case to App\Enums\UserRole does not by
 * itself let the database accept 'banker'. This widens the column.
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
            array_values(array_filter(UserRole::values(), static fn (string $v): bool => $v !== UserRole::Banker->value)),
        ));

        DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
    }
};
