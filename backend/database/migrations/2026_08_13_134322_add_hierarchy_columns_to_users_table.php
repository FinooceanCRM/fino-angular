<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // These columns already ship with the base users table
        // (2024_01_01_000000_create_users_table.php). This migration is
        // kept only for databases created before that column set existed;
        // guard each addColumn so a fresh migration chain doesn't fail with
        // a duplicate-column error.
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'manager_id')) {
                $table->unsignedBigInteger('manager_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('users', 'relationship_manager_id')) {
                $table->unsignedBigInteger('relationship_manager_id')->nullable()->after('manager_id');
            }
            if (! Schema::hasColumn('users', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->nullable()->after('relationship_manager_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['manager_id', 'relationship_manager_id', 'employee_id'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};