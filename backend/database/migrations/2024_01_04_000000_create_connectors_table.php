<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Connector-specific profile data.
 *
 * Identity (name, email, password, role, status) stays in `users`.
 * This table holds ONLY the extra attributes a connector needs, keyed 1:1
 * to the owning user. No user data is duplicated here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connectors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();
            $table->string('pan_number', 20)->nullable();
            $table->string('gst_number', 20)->nullable();

            $table->timestamps();

            $table->index('city');
            $table->index('state');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connectors');
    }
};
