<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Affiliate-specific profile data.
 *
 * Identity (name, email, password, role, status) stays in `users`.
 * This table holds ONLY the extra attributes an affiliate needs, keyed 1:1
 * to the owning user. Affiliates are standalone, like Connector, Banker and
 * Telecaller — outside the manager/RM/employee reporting hierarchy.
 *
 * Signup is self-service with no admin approval gate, but `status` starts
 * at `pending_verification` and only moves to `active` once the affiliate
 * confirms their email (see `email_verified_at`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('referral_code')->unique();
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->string('status', 30)->default('pending_verification');
            $table->timestamp('email_verified_at')->nullable();

            $table->string('alternate_phone', 20)->nullable();
            $table->string('payout_method', 20)->nullable();
            $table->string('payout_account_name')->nullable();
            $table->text('payout_account_number')->nullable();
            $table->text('payout_ifsc_or_upi')->nullable();

            $table->timestamp('joined_at')->nullable();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliates');
    }
};
