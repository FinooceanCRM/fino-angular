<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Personal lead-capture referral link (Manager/RM/Employee/Connector/
 * Banker) — distinct from `connectors.referral_code` (recruiting
 * sub-connectors) and `affiliates.referral_code` (the affiliate's own
 * existing lead-capture link), which serve different purposes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('lead_referral_code', 32)->nullable()->unique()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('lead_referral_code');
        });
    }
};
