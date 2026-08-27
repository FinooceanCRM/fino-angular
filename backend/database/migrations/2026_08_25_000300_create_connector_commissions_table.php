<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per level of the referral chain for every disbursed lead
 * attributed to a connector:
 *   - level 0: the earning connector's own base commission on their lead
 *     (source_connector_id = null).
 *   - level 1: their direct inviter's override (source_connector_id = the
 *     level-0 connector), a percentage of the level-0 amount.
 *   - level 2: that inviter's own inviter's override (source_connector_id =
 *     the level-1 connector), a percentage of the level-1 amount. And so on
 *     up the chain until a connector with no inviter is reached.
 *
 * See App\Services\ConnectorCommissionService for the accrual walk.
 *
 * Unique on (connector_id, loan_lead_id, level) rather than just
 * (connector_id, loan_lead_id): the same connector could in principle earn
 * both a level-0 row (their own lead) and a level-N override row (from a
 * descendant's lead) for two DIFFERENT leads, but never twice for the same
 * lead at the same level — that's the idempotency boundary the accrual
 * service checks before inserting.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connector_commissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('connector_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->foreignId('source_connector_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('level')->default(0);

            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('status', 20)->default('accrued');

            $table->timestamp('accrued_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('payout_id')->nullable()->constrained('connector_payouts')->nullOnDelete();

            $table->timestamps();

            $table->unique(['connector_id', 'loan_lead_id', 'level']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connector_commissions');
    }
};
