<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Distinguishes a request raised from Matched Leads ("Send Request") from
 * one raised from Priority Leads ("Request Full Details") — see
 * App\Enums\AccessRequestOrigin. Defaults existing rows to 'matched', the
 * original (and until now, only) behaviour of this table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_access_requests', function (Blueprint $table): void {
            $table->string('origin', 20)->default('matched')->after('banker_id');
        });
    }

    public function down(): void
    {
        Schema::table('lead_access_requests', function (Blueprint $table): void {
            $table->dropColumn('origin');
        });
    }
};
