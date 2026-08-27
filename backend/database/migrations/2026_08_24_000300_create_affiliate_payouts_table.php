<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A batch payout of accrued commissions to an affiliate. Created before
 * affiliate_commissions so that table's `payout_id` foreign key has
 * something to point at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_payouts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('affiliate_id')->constrained('users')->cascadeOnDelete();
            $table->string('reference')->unique();

            $table->decimal('amount', 12, 2);
            $table->string('method', 20);
            $table->string('status', 20)->default('pending');

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_payouts');
    }
};
