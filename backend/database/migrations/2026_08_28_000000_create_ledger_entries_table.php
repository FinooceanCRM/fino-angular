<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_entries', function (Blueprint $table): void {
            $table->id();
            $table->date('date')->index();
            $table->string('type', 48)->index();
            $table->string('description');
            $table->decimal('debit', 15, 2)->nullable();
            $table->decimal('credit', 15, 2)->nullable();
            // Loose reference back to the LoanLead/Commission/Payout row that
            // caused this entry, for traceability — not a real polymorphic
            // relation (no morph map needed), just class + id for display.
            $table->string('related_type', 191)->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
    }
};
