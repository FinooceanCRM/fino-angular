<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_leads', function (Blueprint $table): void {
            $table->id();
            $table->string('reference', 32)->unique();
            $table->string('applicant_name');
            $table->string('applicant_email')->nullable();
            $table->string('applicant_phone', 32)->nullable();
            $table->string('loan_type', 64)->index();
            $table->decimal('loan_amount', 15, 2)->default(0);
            $table->unsignedSmallInteger('tenure_months')->nullable();
            $table->decimal('monthly_income', 15, 2)->nullable();
            $table->unsignedSmallInteger('credit_score')->nullable();
            $table->string('employment_type', 64)->nullable();
            $table->string('city', 128)->nullable();
            $table->string('state', 128)->nullable();
            $table->string('pincode', 12)->nullable();
            $table->string('status', 48)->default('new')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('connector_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_leads');
    }
};
