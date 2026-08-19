<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Telecaller PD (pre-disbursement verification call) workflow, Phase 6.
 *
 * Lead created -> Telecaller opens lead -> employee info already
 * eager-loaded via `creator` -> PD completed (this) -> Manager review
 * (triggered by the notification LeadService::completePd sends).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->timestamp('pd_completed_at')->nullable()->after('department');
            $table->foreignId('pd_completed_by')->nullable()->after('pd_completed_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('pd_completed_by');
            $table->dropColumn('pd_completed_at');
        });
    }
};
