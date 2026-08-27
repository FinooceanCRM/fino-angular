<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Free-form notes on a Customer. `author_name` is a snapshot (survives the
 * author's account being later deleted); `created_at` only — notes are
 * never edited, mirroring the mock's append-only behaviour.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name', 191);
            $table->text('body');
            $table->timestamp('created_at')->nullable();

            $table->index(['customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_notes');
    }
};
