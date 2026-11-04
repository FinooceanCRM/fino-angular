<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer portal "Profile" section: personal details, KYC documents, bank accounts, UPI IDs,
 * communication preferences and account-deletion requests. All rows belong to one customer user.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->date('dob')->nullable();
            $table->string('gender', 16)->nullable();
            $table->string('marital_status', 16)->nullable();
            $table->string('occupation', 100)->nullable();
            $table->string('language', 16)->default('en');
            $table->string('photo_path')->nullable();
            $table->json('current_address')->nullable();
            $table->json('permanent_address')->nullable();
            $table->boolean('permanent_same_as_current')->default(false);
            $table->json('communication_prefs')->nullable();
            $table->timestamp('deletion_requested_at')->nullable();
            $table->string('deletion_reason', 100)->nullable();
            $table->text('deletion_comments')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_kyc_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type', 100);
            $table->unsignedInteger('size_bytes');
            $table->string('status', 16)->default('pending');
            $table->string('remarks', 255)->nullable();
            // PAN number / last four digits of Aadhaar, shown back to the customer. Never the full Aadhaar.
            $table->string('reference', 32)->nullable();
            $table->timestamps();
            $table->index(['user_id', 'type']);
        });

        Schema::create('customer_bank_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('holder_name', 150);
            $table->string('bank_name', 100);
            $table->text('account_number_encrypted');
            $table->string('account_last4', 4);
            $table->string('ifsc', 11);
            $table->string('account_type', 16);
            $table->string('branch', 150)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->string('status', 16)->default('pending');
            $table->timestamps();
            $table->index(['user_id']);
        });

        Schema::create('customer_upi_ids', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('vpa', 100);
            $table->boolean('is_primary')->default(false);
            $table->string('status', 16)->default('unverified');
            $table->timestamps();
            $table->unique(['user_id', 'vpa']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_upi_ids');
        Schema::dropIfExists('customer_bank_accounts');
        Schema::dropIfExists('customer_kyc_documents');
        Schema::dropIfExists('customer_profiles');
    }
};
