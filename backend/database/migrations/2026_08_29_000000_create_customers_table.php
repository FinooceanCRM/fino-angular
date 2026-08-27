<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer Management (Phase 3 — replaces the mock `CustomerDataProvider`).
 * A Customer is a distinct entity, linkable to multiple leads over time via
 * the `customer_lead` pivot (see the next migration) rather than a field
 * embedded on `loan_leads`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 191);
            $table->string('email', 191);
            $table->string('phone', 32);
            $table->string('segment', 32)->default('Retail');
            $table->string('status', 32)->default('prospect');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['created_by']);
            $table->index(['status']);
            $table->index(['segment']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
