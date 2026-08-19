<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Department assignment (workflow alignment, Phase 2).
 *
 * Always derived from loan_type (see App\Enums\Department::fromLoanType):
 * home -> home_loan, loan_against_property -> mortgage_loan, everything
 * else -> personal_loan. Existing rows are backfilled with the same mapping
 * so the column is never null for a row that already has a loan_type.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->string('department', 30)->nullable()->after('loan_type')->index();
        });

        DB::table('loan_leads')->where('loan_type', 'home')->update(['department' => 'home_loan']);
        DB::table('loan_leads')->where('loan_type', 'loan_against_property')->update(['department' => 'mortgage_loan']);
        DB::table('loan_leads')
            ->whereNotIn('loan_type', ['home', 'loan_against_property'])
            ->update(['department' => 'personal_loan']);
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->dropColumn('department');
        });
    }
};
