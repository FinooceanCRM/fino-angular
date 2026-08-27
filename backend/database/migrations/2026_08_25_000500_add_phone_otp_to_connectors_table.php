<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Connector signup now verifies via a phone OTP instead of an email
     * link — `email_verified_at` (added in the referral-program migration)
     * is no longer read anywhere, but is left in place rather than dropped
     * to avoid a risky column rename/drop on every DB driver this app runs
     * against (sqlite in tests, mysql in prod).
     */
    public function up(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->string('otp_code', 6)->nullable()->after('email_verified_at');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->timestamp('phone_verified_at')->nullable()->after('otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->dropColumn(['otp_code', 'otp_expires_at', 'phone_verified_at']);
        });
    }
};
