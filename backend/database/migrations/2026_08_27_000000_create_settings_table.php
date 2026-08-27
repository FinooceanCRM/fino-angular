<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Singleton settings document (Phase 1) — replaces the frontend's
 * `SettingsDataProvider` mock. Exactly one row, id=1, ever exists; each
 * column is a JSON blob for one settings section so the shape can evolve
 * without further migrations. Seed values below are copied verbatim from
 * `frontend/.../data/providers/settings-data.provider.ts` (`SEED_SETTINGS`)
 * so the UI shows the same content it did against the mock.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->json('general');
            $table->json('matching_engine');
            $table->json('notifications');
            $table->json('security');
            $table->timestamps();
        });

        $now = now();

        DB::table('settings')->insert([
            'id' => 1,
            'general' => json_encode([
                'company' => [
                    'company_name' => 'FinoOcean',
                    'support_email' => 'support@finoocean.com',
                    'support_phone' => '+91 22 4000 5000',
                    'address' => 'FinoOcean Towers, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
                    'currency' => 'INR',
                ],
                'branding' => [
                    'primary_color' => '#0B5FFF',
                    'logo_url' => 'https://assets.finoocean.com/brand/logo.svg',
                    'favicon_url' => 'https://assets.finoocean.com/brand/favicon.png',
                    'tagline' => 'Loans, matched right.',
                ],
                'email' => [
                    'from_name' => 'FinoOcean',
                    'from_email' => 'no-reply@finoocean.com',
                    'reply_to_email' => 'support@finoocean.com',
                    'footer_text' => '© FinoOcean. This is an automated message — please do not reply directly.',
                ],
                'regional' => [
                    'timezone' => 'Asia/Kolkata',
                    'date_format' => 'DD MMM YYYY',
                    'business_hours' => '9:00 AM – 6:00 PM IST, Mon–Sat',
                ],
                'platform' => [
                    'default_page_size' => 15,
                    'maintenance_mode' => false,
                ],
            ]),
            'matching_engine' => json_encode([
                'min_cibil_score' => 650,
                'min_match_score' => 60,
                'auto_run_on_create' => true,
                'enabled_loan_types' => [
                    'home', 'personal', 'business', 'auto', 'education', 'loan_against_property',
                ],
                'loan_amount_limits' => [
                    ['loan_type' => 'home', 'min_amount' => 500000, 'max_amount' => 20000000],
                    ['loan_type' => 'personal', 'min_amount' => 50000, 'max_amount' => 2500000],
                    ['loan_type' => 'business', 'min_amount' => 200000, 'max_amount' => 15000000],
                    ['loan_type' => 'auto', 'min_amount' => 100000, 'max_amount' => 5000000],
                    ['loan_type' => 'education', 'min_amount' => 100000, 'max_amount' => 4000000],
                    ['loan_type' => 'loan_against_property', 'min_amount' => 500000, 'max_amount' => 30000000],
                ],
                'city_mapping' => [
                    ['city' => 'Mumbai', 'state' => 'Maharashtra', 'tier' => 'Tier 1', 'serviceable' => true],
                    ['city' => 'Delhi', 'state' => 'Delhi', 'tier' => 'Tier 1', 'serviceable' => true],
                    ['city' => 'Bengaluru', 'state' => 'Karnataka', 'tier' => 'Tier 1', 'serviceable' => true],
                    ['city' => 'Chennai', 'state' => 'Tamil Nadu', 'tier' => 'Tier 1', 'serviceable' => true],
                    ['city' => 'Hyderabad', 'state' => 'Telangana', 'tier' => 'Tier 1', 'serviceable' => true],
                    ['city' => 'Pune', 'state' => 'Maharashtra', 'tier' => 'Tier 1', 'serviceable' => true],
                    ['city' => 'Ahmedabad', 'state' => 'Gujarat', 'tier' => 'Tier 2', 'serviceable' => true],
                    ['city' => 'Jaipur', 'state' => 'Rajasthan', 'tier' => 'Tier 2', 'serviceable' => false],
                ],
            ]),
            'notifications' => json_encode([
                'email_enabled' => true,
                'sms_enabled' => false,
                'push_enabled' => true,
                'digest_frequency' => 'real_time',
                'category_channels' => [
                    'leads' => true,
                    'users' => true,
                    'banking' => true,
                    'documents' => true,
                    'commission' => true,
                    'system' => true,
                ],
            ]),
            'security' => json_encode([
                'session_timeout_minutes' => 60,
                'min_password_length' => 8,
                'require_special_character' => true,
                'require_number' => true,
                'two_factor_required' => false,
                'max_login_attempts' => 5,
                'ip_allowlist_enabled' => false,
                'ip_allowlist' => '',
            ]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
