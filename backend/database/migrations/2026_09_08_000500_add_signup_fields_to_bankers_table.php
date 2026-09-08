<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extra columns the public "Join as Banker" signup needs on top of the
 * original `bankers` table (2026_08_14_100200_create_bankers_table.php).
 *
 * Identity (name, email, password, role) still lives on `users`. These are
 * the banker-specific attributes captured on the self-service registration
 * form — personal (first/last name, country, PAN), full bank details
 * (branch address/location + the bank's own city/state), the products the
 * banker handles, and the reporting manager's contact — plus the same
 * phone-OTP signup gate the Vendor and Connector modules use: the account
 * stays inactive (`users.is_active = false`, `bankers.status =
 * pending_verification`) until the 6-digit code is confirmed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bankers', function (Blueprint $table): void {
            // Personal details (from the "User Registration Fields" block).
            $table->string('first_name', 100)->nullable()->after('user_id');
            $table->string('last_name', 100)->nullable()->after('first_name');
            $table->string('country', 100)->nullable()->after('pincode');
            $table->string('pan_number', 20)->nullable()->after('country');

            // Full bank details (the "Bank Details" block). `bank_name` and
            // `branch` already exist; these add the rest.
            $table->string('branch_address')->nullable()->after('bank_name');
            $table->string('branch_location')->nullable()->after('branch_address');
            $table->string('bank_city', 100)->nullable()->after('branch_location');
            $table->string('bank_state', 100)->nullable()->after('bank_city');

            // Loan products the banker handles — multi-select on the signup
            // form (Personal / Business / Home / Car / Mortgage Loan).
            $table->json('products')->nullable()->after('bank_state');

            // Reporting manager's contact (the "Manager Details" block).
            $table->string('manager_name', 150)->nullable()->after('products');
            $table->string('manager_email', 180)->nullable()->after('manager_name');
            $table->string('manager_phone', 20)->nullable()->after('manager_email');

            // Signup lifecycle + phone-OTP gate (see BankerRegistrationService).
            $table->string('status', 32)->default('active')->index()->after('manager_phone');
            $table->string('otp_code', 6)->nullable()->after('status');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->timestamp('phone_verified_at')->nullable()->after('otp_expires_at');
            $table->timestamp('joined_at')->nullable()->after('phone_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('bankers', function (Blueprint $table): void {
            $table->dropColumn([
                'first_name',
                'last_name',
                'country',
                'pan_number',
                'branch_address',
                'branch_location',
                'bank_city',
                'bank_state',
                'products',
                'manager_name',
                'manager_email',
                'manager_phone',
                'status',
                'otp_code',
                'otp_expires_at',
                'phone_verified_at',
                'joined_at',
            ]);
        });
    }
};
