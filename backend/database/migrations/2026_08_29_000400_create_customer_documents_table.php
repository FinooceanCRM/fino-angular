<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mirrors the `documents` table shape (see CustomerDocumentService), but for
 * Customer-attached files instead of Lead-attached ones. Real file storage
 * via the local disk, same as Document — no mock byte-less "upload" here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('document_type', 64)->index();
            $table->string('original_name', 191);
            $table->string('path', 255);
            $table->string('mime_type', 128)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('status', 48)->default('pending')->index();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_documents');
    }
};
