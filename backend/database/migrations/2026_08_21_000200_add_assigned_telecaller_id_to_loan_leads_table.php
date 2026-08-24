<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets Super Admin, Manager or Relationship Manager explicitly hand a lead
 * to a specific Telecaller for PD calling — previously a Telecaller's queue
 * was populated only implicitly (department + employee-authored leads), with
 * no way to route an individual lead to an individual Telecaller.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('loan_leads', 'assigned_telecaller_id')) {
                $table->foreignId('assigned_telecaller_id')->nullable()->after('assigned_banker_id')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (Schema::hasColumn('loan_leads', 'assigned_telecaller_id')) {
                $table->dropConstrainedForeignKey('assigned_telecaller_id');
            }
        });
    }
};
