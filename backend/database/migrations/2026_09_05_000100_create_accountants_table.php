<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Accounts/finance staff profile data.
 *
 * Identity (name, email, password, role, status) stays in `users`.
 * This table holds ONLY the extra attributes an accounts user needs, keyed
 * 1:1 to the owning user. Accounts is standalone, like Banker and
 * Telecaller — outside the manager/RM/employee hierarchy, no department.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accountants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('designation')->nullable();
            $table->string('branch')->nullable();
            $table->string('employee_code', 40)->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accountants');
    }
};
