<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** New default popup schedule: first after 15 s, second 2 minutes after that, then every 15 minutes. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->unsignedInteger('first_delay_seconds')->default(15)->change();
            $table->unsignedInteger('second_delay_seconds')->default(120)->change();
            $table->unsignedInteger('repeat_gap_seconds')->default(900)->change();
        });
        // Rows still on the previous defaults move to the new ones; anything the admin customised is left alone.
        DB::table('offer_settings')->where(['first_delay_seconds' => 0, 'second_delay_seconds' => 15, 'repeat_gap_seconds' => 120])
            ->update(['first_delay_seconds' => 15, 'second_delay_seconds' => 120, 'repeat_gap_seconds' => 900]);
    }

    public function down(): void
    {
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->unsignedInteger('first_delay_seconds')->default(0)->change();
            $table->unsignedInteger('second_delay_seconds')->default(15)->change();
            $table->unsignedInteger('repeat_gap_seconds')->default(120)->change();
        });
    }
};
