<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Banker-specific profile data.
 *
 * Identity (name, email, password, role, status) stays in `users`.
 * This table holds ONLY the extra attributes a banker needs, keyed 1:1
 * to the owning user. No user data is duplicated here. Bankers are
 * standalone, like Connector — outside the manager/RM/employee hierarchy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bankers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('bank_name')->nullable();
            $table->string('branch')->nullable();
            $table->string('designation')->nullable();
            $table->string('employee_code', 40)->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();

            $table->timestamps();

            $table->index('city');
            $table->index('state');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bankers');
    }
};
