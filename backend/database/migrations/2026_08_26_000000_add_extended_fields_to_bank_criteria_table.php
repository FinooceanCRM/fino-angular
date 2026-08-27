<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the remaining "Submit Bank Criteria" screenshot fields not already
 * covered by the base table (min_age/max_age were already present).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_criteria', function (Blueprint $table): void {
            $table->unsignedSmallInteger('max_tenure_months')->nullable()->after('interest_rate');
            $table->string('processing_fee', 64)->nullable()->after('max_tenure_months');
            $table->decimal('foir_dbr', 5, 2)->nullable()->after('processing_fee');
            $table->unsignedTinyInteger('business_vintage_years')->nullable()->after('foir_dbr');
            $table->text('eligible_locations')->nullable()->after('business_vintage_years');
            $table->text('negative_profile_rules')->nullable()->after('eligible_locations');
            $table->text('special_conditions')->nullable()->after('negative_profile_rules');
        });
    }

    public function down(): void
    {
        Schema::table('bank_criteria', function (Blueprint $table): void {
            $table->dropColumn([
                'max_tenure_months',
                'processing_fee',
                'foir_dbr',
                'business_vintage_years',
                'eligible_locations',
                'negative_profile_rules',
                'special_conditions',
            ]);
        });
    }
};
