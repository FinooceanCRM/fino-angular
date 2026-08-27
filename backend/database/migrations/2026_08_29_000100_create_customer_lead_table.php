<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot linking a Customer to the Leads it originated from/relates to.
 * Many-to-many by design (a customer may be linked to multiple leads over
 * time) — see CustomerService::linkLead()/unlinkLead().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_lead', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['customer_id', 'loan_lead_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_lead');
    }
};
