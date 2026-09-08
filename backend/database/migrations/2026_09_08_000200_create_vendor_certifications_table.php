<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vendor Certification — the Fino-native rebuild of the source "Customer
 * Survey" record (`customer_surveys` in the reference PHP app), every column
 * carried over, plus:
 *   - `vendor_id`         : the owning vendor. ALWAYS derived server-side
 *                           from the authenticated user; never trusted from
 *                           the browser.
 *   - `certificate_number`: assigned only on submit (VC0000001…), like the
 *                           source's `survey_number`.
 *   - `status`            : gains a `draft` value — the source app kept the
 *                           in-progress survey in a PHP session, but Fino is
 *                           stateless (bearer tokens), so the draft is a row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_certifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_id')->constrained('users')->cascadeOnDelete();
            $table->string('certificate_number', 20)->nullable()->unique();

            // Step 2 — personal
            $table->string('full_name', 150)->nullable();
            $table->string('guardian_name', 150)->nullable();
            $table->enum('gender', ['Male', 'Female', 'Other'])->default('Male');
            $table->unsignedTinyInteger('age')->nullable();
            $table->date('dob')->nullable();
            $table->string('mobile', 15)->nullable();
            $table->string('alt_mobile', 15)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('aadhaar_number', 20)->nullable();
            $table->string('occupation', 120)->nullable();
            $table->string('education', 80)->nullable();
            $table->string('category', 80)->nullable();
            $table->string('social_category', 40)->nullable();

            // Step 2 — business
            $table->string('shop_name', 180)->nullable();
            $table->string('business_type', 120)->nullable();
            $table->string('vendor_category', 120)->nullable();
            $table->unsignedSmallInteger('years_in_business')->nullable();
            $table->string('ownership', 60)->nullable();
            $table->string('gst_number', 30)->nullable();
            $table->string('license_number', 60)->nullable();
            $table->decimal('daily_income', 12, 2)->nullable();
            $table->decimal('monthly_income', 12, 2)->nullable();
            $table->unsignedSmallInteger('employees')->default(0);
            $table->enum('seasonal_business', ['Yes', 'No'])->default('No');
            $table->time('business_open_time')->nullable();
            $table->time('business_close_time')->nullable();
            $table->string('weekly_holiday', 20)->nullable();

            // Step 3 — location / GPS
            $table->decimal('gps_latitude', 10, 7)->nullable();
            $table->decimal('gps_longitude', 10, 7)->nullable();
            $table->decimal('accuracy', 10, 2)->nullable();
            $table->decimal('gps_heading', 6, 2)->nullable();
            $table->decimal('gps_speed', 8, 2)->nullable();
            $table->dateTime('gps_captured_at')->nullable();
            $table->boolean('location_verified')->default(false);
            $table->enum('location_mode', ['gps', 'manual'])->default('manual');

            // Step 3 — address
            $table->string('house_no', 60)->nullable();
            $table->string('building', 150)->nullable();
            $table->string('street', 150)->nullable();
            $table->string('area', 150)->nullable();
            $table->string('village', 150)->nullable();
            $table->string('address', 500)->nullable();
            $table->string('landmark', 200)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('district', 120)->nullable();
            $table->string('state', 120)->nullable();
            $table->string('pin_code', 10)->nullable();
            $table->string('country', 80)->nullable();

            // Step 5 — declarations
            $table->boolean('declaration_truth')->default(false);
            $table->boolean('declaration_submit')->default(false);

            // Meta
            $table->string('status', 20)->default('draft')->index();
            $table->string('remarks', 500)->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('device', 120)->nullable();
            $table->string('browser', 120)->nullable();
            $table->string('user_agent', 400)->nullable();

            $table->timestamps();

            $table->index(['vendor_id', 'status']);
            $table->index('mobile');
            $table->index(['gps_latitude', 'gps_longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_certifications');
    }
};
