<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A banker requests access to a lead that's been matched against one of
 * their bank_criteria rows. A Manager/RM/Super Admin who can already see
 * that lead approves or rejects the request; approval assigns the lead to
 * the banker via the existing LeadService::assign() flow.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_access_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->foreignId('banker_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20)->default('pending')->index();
            $table->text('remarks')->nullable();
            $table->text('decision_remarks')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index(['loan_lead_id', 'banker_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_access_requests');
    }
};
