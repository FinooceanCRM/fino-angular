<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 9 — completes the loan-management workflow schema.
 * Adds the full assignment chain to loan_leads and eligibility rules to
 * bank_criteria. Existing Phase 3 tables are preserved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('loan_leads', 'assigned_employee_id')) {
                $table->foreignId('assigned_employee_id')->nullable()->after('connector_id')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('loan_leads', 'assigned_relationship_manager_id')) {
                $table->foreignId('assigned_relationship_manager_id')->nullable()->after('assigned_employee_id')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('loan_leads', 'assigned_manager_id')) {
                $table->foreignId('assigned_manager_id')->nullable()->after('assigned_relationship_manager_id')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('loan_leads', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by')
                    ->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('bank_criteria', function (Blueprint $table): void {
            if (! Schema::hasColumn('bank_criteria', 'eligibility_rules')) {
                $table->json('eligibility_rules')->nullable()->after('interest_rate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            foreach ([
                'assigned_employee_id',
                'assigned_relationship_manager_id',
                'assigned_manager_id',
                'updated_by',
            ] as $column) {
                if (Schema::hasColumn('loan_leads', $column)) {
                    $table->dropConstrainedForeignKey($column);
                }
            }
        });

        Schema::table('bank_criteria', function (Blueprint $table): void {
            if (Schema::hasColumn('bank_criteria', 'eligibility_rules')) {
                $table->dropColumn('eligibility_rules');
            }
        });
    }
};
