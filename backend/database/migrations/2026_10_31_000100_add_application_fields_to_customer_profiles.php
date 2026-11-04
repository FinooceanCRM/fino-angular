<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Everything the loan application asks for can also be kept on the customer's profile (all optional), so the
 * application form can be pre-filled. The Aadhaar number is stored encrypted and only ever returned to its owner.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table): void {
            $table->string('pan', 10)->nullable()->after('occupation');
            $table->text('aadhaar')->nullable()->after('pan');
            $table->string('employment_type', 24)->nullable()->after('aadhaar');
            $table->string('company', 150)->nullable()->after('employment_type');
            $table->string('designation', 100)->nullable()->after('company');
            $table->decimal('experience_years', 4, 1)->nullable()->after('designation');
            $table->decimal('monthly_income', 14, 2)->nullable()->after('experience_years');
            $table->string('office_address', 255)->nullable()->after('monthly_income');
            $table->string('work_city', 100)->nullable()->after('office_address');
        });
    }

    public function down(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table): void {
            $table->dropColumn(['pan', 'aadhaar', 'employment_type', 'company', 'designation', 'experience_years', 'monthly_income', 'office_address', 'work_city']);
        });
    }
};
