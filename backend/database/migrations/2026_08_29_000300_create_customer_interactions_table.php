<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Activity History timeline entries for a Customer — appended by
 * CustomerService (create/addNote) and CustomerDocumentService (upload/
 * verify/reject), mirroring the mock's single-timeline behaviour.
 * `created_at` only — entries are never edited.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_interactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('icon', 64);
            $table->string('title', 191);
            $table->string('subtitle', 255)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_interactions');
    }
};
