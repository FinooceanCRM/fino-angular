<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            // Snapshots: the row must still read correctly once the actor is
            // renamed or deleted, so the actor's name/role are copied in at
            // write time rather than joined at read time.
            $table->string('actor_name', 191);
            $table->string('actor_role', 64);
            $table->string('action', 64);
            $table->string('entity_type', 64)->index();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_label', 191);
            $table->text('description');
            $table->string('category', 32);
            $table->string('ip_address', 64)->nullable();
            // Append-only log: no updated_at column.
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
