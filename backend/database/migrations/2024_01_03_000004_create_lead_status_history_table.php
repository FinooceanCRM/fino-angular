<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_status_history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->string('from_status', 48)->nullable();
            $table->string('to_status', 48)->index();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_status_history');
    }
};
