<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Connectors stay outside the reporting hierarchy, but a Relationship Manager
 * may be their point of contact. The assignment lives on the connector profile
 * (NOT on `users.relationship_manager_id`) so the hierarchy is untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->foreignId('relationship_manager_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->dropForeign(['relationship_manager_id']);
            $table->dropColumn('relationship_manager_id');
        });
    }
};
