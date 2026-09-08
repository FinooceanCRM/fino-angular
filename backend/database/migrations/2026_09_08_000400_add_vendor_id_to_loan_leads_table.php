<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A loan lead may originate from a vendor's "Request a Loan" action, exactly
 * as one may originate from a connector or an affiliate. Same shape as
 * 2026_08_24_000200_add_affiliate_id_to_loan_leads_table: the column points
 * at `users` (the vendor-role user), never at the `vendors` profile table,
 * and is set server-side from the authenticated user — never from the
 * request body.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('loan_leads', 'vendor_id')) {
                $table->foreignId('vendor_id')->nullable()->after('affiliate_id')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            if (Schema::hasColumn('loan_leads', 'vendor_id')) {
                $table->dropConstrainedForeignKey('vendor_id');
            }
        });
    }
};
