<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Full PD (pre-disbursement verification) data capture, successor to the
 * timestamp-only Phase 6 `pd_completed_at`/`pd_completed_by` columns.
 *
 * Recreates the ~275-field dataset the legacy WordPress Fluent Form #39
 * ('PD Form') collected — personal/address/employment/salary/business/ITR/
 * partner-director/family-banking/existing-loans/property — as a single
 * validated JSON blob, the same storage pattern already used for the lead
 * creation wizard's `details` column. Kept as its own column (not merged
 * into `details`) since the two are captured at different workflow stages
 * by different roles.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->json('pd_details')->nullable()->after('pd_completed_by');
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->dropColumn('pd_details');
        });
    }
};
