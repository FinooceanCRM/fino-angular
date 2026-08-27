<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 6 — the Super Admin's reason for rejecting/failing a payout needs a
 * home, same as LeadAccessRequest.decision_remarks does for access-request
 * decisions. Nullable: only set on a rejected/failed payout.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_payouts', function (Blueprint $table): void {
            if (! Schema::hasColumn('affiliate_payouts', 'failure_reason')) {
                $table->text('failure_reason')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_payouts', function (Blueprint $table): void {
            if (Schema::hasColumn('affiliate_payouts', 'failure_reason')) {
                $table->dropColumn('failure_reason');
            }
        });
    }
};
