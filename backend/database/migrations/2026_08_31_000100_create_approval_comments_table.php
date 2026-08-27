<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comment thread on an Approval — append-only, `created_at` only, same
 * shape as `customer_notes`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_comments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('approval_id')->constrained('approvals')->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamp('created_at')->nullable();

            $table->index(['approval_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_comments');
    }
};
