<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Follow-up priority (low/medium/high), backing the reminder KPIs and
 * calendar view on the Telecaller dashboard.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('telecaller_follow_ups', function (Blueprint $table): void {
            $table->string('priority', 10)->default('medium')->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('telecaller_follow_ups', function (Blueprint $table): void {
            $table->dropColumn('priority');
        });
    }
};
