<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Per-user notification preferences, shown on the Profile page's Preferences section. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('email_notifications')->default(true)->after('is_active');
            $table->boolean('sms_notifications')->default(true)->after('email_notifications');
            $table->boolean('notify_on_assignment')->default(true)->after('sms_notifications');
            $table->boolean('notify_on_approval')->default(true)->after('notify_on_assignment');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email_notifications', 'sms_notifications', 'notify_on_assignment', 'notify_on_approval']);
        });
    }
};
