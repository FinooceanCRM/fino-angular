<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Admin switch for the small "call me back" popup shown first to guests (it is still governed by the main popup switch). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->boolean('callback_enabled')->default(true)->after('popup_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('offer_settings', function (Blueprint $table): void {
            $table->dropColumn('callback_enabled');
        });
    }
};
