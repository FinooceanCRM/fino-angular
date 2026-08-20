<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Telecaller follow-up/note log for a lead — calls, meetings, reminders and
 * free-form notes, plus an optional next-follow-up date. Deliberately a
 * separate table from `lead_follow_ups` (the Banker-only log): Telecaller
 * follow-ups are usable on any lead she can already see (own submissions and
 * her department's PD queue), with no full-access gate. Enforced by
 * TelecallerFollowUpPolicy, not by this schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telecaller_follow_ups', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->foreignId('telecaller_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 20)->default('note');
            $table->text('notes')->nullable();
            $table->timestamp('next_follow_up_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['loan_lead_id', 'telecaller_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telecaller_follow_ups');
    }
};
