<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One commission row per (affiliate, loan_lead) pair, created via
 * updateOrCreate the same way LeadMatchingService keys LeadMatch rows on
 * (loan_lead_id, bank_criteria_id). Commission accrues only when a lead's
 * status transitions to `disbursed` — `commission_rate` snapshots the rate
 * actually applied at that moment, independent of later changes to the
 * affiliate's rate or the global default.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_commissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('affiliate_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();

            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('status', 20)->default('accrued');

            $table->timestamp('accrued_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('payout_id')->nullable()->constrained('affiliate_payouts')->nullOnDelete();

            $table->timestamps();

            $table->unique(['affiliate_id', 'loan_lead_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_commissions');
    }
};
