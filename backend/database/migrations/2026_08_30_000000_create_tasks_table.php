<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tasks (Phase 4 — replaces the mock `TaskDataProvider` and the
 * Relationship Manager module's mock `RelationshipManagerActivityDataProvider`).
 * One unified table backs Calls/Meetings/Tasks/Reminders for every role —
 * the RM Activities tabs are a filtered view over this same table, not a
 * separate feature (see TaskService/TaskController).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 16); // call|meeting|task|reminder
            $table->string('title', 191);
            $table->text('description')->nullable();
            $table->foreignId('loan_lead_id')->nullable()->constrained('loan_leads')->nullOnDelete();
            $table->string('priority', 16); // low|medium|high
            $table->dateTime('due_at');
            $table->string('status', 16)->default('pending'); // pending|completed|cancelled
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->index(['assigned_to']);
            $table->index(['due_at']);
            $table->index(['type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
