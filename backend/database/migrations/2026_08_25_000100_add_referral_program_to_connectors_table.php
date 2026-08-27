<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Connector referral network + commission program: every connector gets an
 * outbound invite code (`referral_code`) and may optionally have been
 * invited by another connector (`referred_by_connector_id`, self-referencing
 * via `users.id` — the same convention `loan_leads.connector_id`/
 * `affiliate_id` already use, not the `connectors.id` profile key).
 *
 * `status`/`email_verified_at`/`joined_at` mirror the Affiliate self-service
 * signup gate (App\Enums\ConnectorStatus). Existing connectors predate this
 * column and were created directly by a Super Admin (never went through a
 * verification step), so they're backfilled to `active` below rather than
 * left at the new-row default of `pending_verification`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->string('referral_code')->nullable()->unique()->after('user_id');
            $table->foreignId('referred_by_connector_id')->nullable()->after('referral_code')
                ->constrained('users')->nullOnDelete();
            $table->decimal('commission_rate', 5, 2)->nullable()->after('referred_by_connector_id');
            $table->string('status', 30)->default('pending_verification')->after('commission_rate');
            $table->timestamp('email_verified_at')->nullable()->after('status');
            $table->timestamp('joined_at')->nullable()->after('email_verified_at');

            $table->index('status');
        });

        DB::table('connectors')->update([
            'status' => 'active',
            'email_verified_at' => now(),
            'joined_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('connectors', function (Blueprint $table): void {
            $table->dropConstrainedForeignKey('referred_by_connector_id');
            $table->dropColumn(['referral_code', 'commission_rate', 'status', 'email_verified_at', 'joined_at']);
        });
    }
};
