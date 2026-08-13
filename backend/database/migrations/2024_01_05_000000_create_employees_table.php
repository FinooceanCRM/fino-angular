<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Employee-specific profile data (Phase 6).
 *
 * Identity (name, email, password, role, status) and the reporting links
 * (manager_id, relationship_manager_id) stay in `users`. This table holds
 * ONLY the extra attributes an employee needs, keyed 1:1 to the owning user.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('employee_code', 50)->nullable()->unique();
            $table->string('designation', 150)->nullable();
            $table->string('department', 150)->nullable();
            $table->date('date_of_joining')->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();
            $table->string('emergency_contact_name', 150)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();

            $table->timestamps();

            $table->index('department');
            $table->index('city');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
