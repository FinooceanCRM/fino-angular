<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Banker-only follow-up log for a lead — calls, meetings, reminders and
 * free-form notes, plus an optional next-follow-up date. Only usable once
 * the banker has full access to the lead (an approved LeadAccessRequest);
 * enforced by LeadFollowUpPolicy, not by this schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_follow_ups', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->foreignId('banker_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 20)->default('note');
            $table->text('notes')->nullable();
            $table->timestamp('next_follow_up_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['loan_lead_id', 'banker_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_follow_ups');
    }
};
