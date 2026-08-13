<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_criteria', function (Blueprint $table): void {
            $table->id();
            $table->string('bank_name', 191)->index();
            $table->string('product_name', 191);
            $table->string('loan_type', 64)->index();
            $table->decimal('min_loan_amount', 15, 2)->default(0);
            $table->decimal('max_loan_amount', 15, 2)->nullable();
            $table->decimal('min_monthly_income', 15, 2)->default(0);
            $table->unsignedSmallInteger('min_credit_score')->nullable();
            $table->unsignedTinyInteger('min_age')->nullable();
            $table->unsignedTinyInteger('max_age')->nullable();
            $table->string('employment_type', 64)->nullable();
            $table->decimal('interest_rate', 5, 2)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('banker_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_criteria');
    }
};
