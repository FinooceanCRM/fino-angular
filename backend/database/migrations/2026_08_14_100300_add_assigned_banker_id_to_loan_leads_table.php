<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('loan_leads', 'assigned_banker_id')) {
                $table->foreignId('assigned_banker_id')->nullable()->after('assigned_manager_id')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (Schema::hasColumn('loan_leads', 'assigned_banker_id')) {
                $table->dropConstrainedForeignKey('assigned_banker_id');
            }
        });
    }
};
