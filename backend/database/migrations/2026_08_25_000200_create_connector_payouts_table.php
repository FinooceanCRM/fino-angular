<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A batch payout of accrued commissions (base + referral-override, both) to
 * a connector. Created before connector_commissions so that table's
 * `payout_id` foreign key has something to point at — same ordering lesson
 * as affiliate_payouts/affiliate_commissions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connector_payouts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('connector_id')->constrained('users')->cascadeOnDelete();
            $table->string('reference')->unique();

            $table->decimal('amount', 12, 2);
            $table->string('method', 20);
            $table->string('status', 20)->default('pending');
            $table->text('failure_reason')->nullable();

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connector_payouts');
    }
};
