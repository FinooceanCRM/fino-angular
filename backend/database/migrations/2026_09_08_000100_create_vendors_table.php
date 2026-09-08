<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vendor-specific profile data.
 *
 * Identity (name, email, password, role, status) stays in `users`.
 * This table holds ONLY the extra attributes a vendor needs, keyed 1:1 to
 * the owning user — same shape as `connectors` / `accountants`. No user
 * data is duplicated here.
 *
 * A vendor self-registers through the public "Join as Vendor" page and the
 * account stays inactive (`users.is_active = false`, `vendors.status =
 * pending_verification`) until the 6-digit OTP sent to the signup phone
 * number is confirmed — the same gate Connector signup uses.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('business_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();
            $table->string('pan_number', 20)->nullable();
            $table->string('gst_number', 20)->nullable();

            $table->string('status', 32)->default('pending_verification')->index();

            // Signup phone-OTP gate (see VendorRegistrationService).
            $table->string('otp_code', 6)->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();

            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->index('city');
            $table->index('state');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
