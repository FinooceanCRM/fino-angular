<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The connector payout flow (App\Services\ConnectorPayoutService) needs a
 * payout method before a request can be made — the `connectors` table had
 * no such fields at all until now. Mirrors the equivalent affiliates
 * columns exactly (see 2026_08_24_000100_create_affiliates_table.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->string('payout_method', 20)->nullable()->after('joined_at');
            $table->string('payout_account_name')->nullable()->after('payout_method');
            $table->text('payout_account_number')->nullable()->after('payout_account_name');
            $table->text('payout_ifsc_or_upi')->nullable()->after('payout_account_number');
        });
    }

    public function down(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->dropColumn(['payout_method', 'payout_account_name', 'payout_account_number', 'payout_ifsc_or_upi']);
        });
    }
};
