<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Telecaller-specific profile data.
 *
 * Identity (name, email, password, role, status, department) stays in
 * `users`. This table holds ONLY the extra attributes a telecaller needs,
 * keyed 1:1 to the owning user. Telecallers are standalone, like Connector
 * and Banker — outside the manager/RM/employee reporting hierarchy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telecallers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

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
        Schema::dropIfExists('telecallers');
    }
};
