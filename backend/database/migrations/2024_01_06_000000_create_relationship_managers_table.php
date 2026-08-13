<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relationship Manager profile data (Phase 7).
 *
 * Identity (name, email, password, role, status) and the reporting link to a
 * Manager stay in `users`. This table holds ONLY the extra attributes a
 * Relationship Manager needs, keyed 1:1 to the owning user.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relationship_managers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('rm_code', 50)->nullable()->unique();
            $table->string('designation', 150)->nullable();
            $table->string('branch', 150)->nullable();
            $table->string('region', 150)->nullable();
            $table->date('date_of_joining')->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();

            $table->timestamps();

            $table->index('branch');
            $table->index('region');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relationship_managers');
    }
};
