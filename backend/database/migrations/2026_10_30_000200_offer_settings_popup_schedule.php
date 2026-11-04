<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The popup runs on a short schedule (first at once, second soon after, then at a steady gap) instead of one delay + cooldown. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->unsignedInteger('first_delay_seconds')->default(0)->after('popup_enabled');
            $table->unsignedInteger('second_delay_seconds')->default(15)->after('first_delay_seconds');
            $table->unsignedInteger('repeat_gap_seconds')->default(120)->after('second_delay_seconds');
        });
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->dropColumn(['popup_delay_minutes', 'cooldown_days']);
        });
    }

    public function down(): void
    {
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->unsignedSmallInteger('popup_delay_minutes')->default(15);
            $table->unsignedSmallInteger('cooldown_days')->default(7);
        });
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->dropColumn(['first_delay_seconds', 'second_delay_seconds', 'repeat_gap_seconds']);
        });
    }
};
