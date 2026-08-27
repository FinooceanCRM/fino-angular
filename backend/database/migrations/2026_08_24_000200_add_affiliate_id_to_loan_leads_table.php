<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A loan lead may originate from an affiliate's referral link, same as it
 * may originate from a connector. Both columns point at `users` (the
 * connector/affiliate role user), not at the connectors/affiliates profile
 * tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('loan_leads', 'affiliate_id')) {
                $table->foreignId('affiliate_id')->nullable()->after('connector_id')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (Schema::hasColumn('loan_leads', 'affiliate_id')) {
                $table->dropConstrainedForeignKey('affiliate_id');
            }
        });
    }
};
