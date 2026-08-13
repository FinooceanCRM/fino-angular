<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_matches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->foreignId('bank_criteria_id')->constrained('bank_criteria')->cascadeOnDelete();
            $table->unsignedTinyInteger('match_score')->default(0);
            $table->string('status', 48)->default('matched')->index();
            $table->json('reasons')->nullable();
            $table->timestamps();

            $table->unique(['loan_lead_id', 'bank_criteria_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_matches');
    }
};
