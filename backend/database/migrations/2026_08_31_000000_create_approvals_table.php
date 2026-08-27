<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Approval Center (Phase 5, Part A) — Banker / Lead / Document approval
 * requests. Replaces the mock `ManagerApprovalDataProvider`'s seed rows for
 * these three types; the fourth mock type, `access`, already has a real
 * backend of its own (`lead_access_requests`) and is not duplicated here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 32)->index();
            $table->string('title', 191);
            $table->string('subtitle', 255)->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('requested_at')->useCurrent();
            $table->string('status', 16)->default('pending')->index();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->text('decision_remarks')->nullable();
            $table->foreignId('loan_lead_id')->nullable()->constrained('loan_leads')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
