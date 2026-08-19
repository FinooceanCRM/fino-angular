<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The lead creation wizard (Angular) captures additional applicant, address
 * and loan-type-specific fields (gender, DOB, marital status, address,
 * property type, balance transfer, etc.) that don't warrant a dedicated
 * column each. They are stored together as a single JSON blob, mirroring
 * the `details` JSON column the legacy WordPress `fino_leads` table used
 * for the same purpose.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->json('details')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->dropColumn('details');
        });
    }
};
