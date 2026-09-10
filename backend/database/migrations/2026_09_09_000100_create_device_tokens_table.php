<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Push-notification device registrations (Phase: mobile app). Each row is a
 * single FCM registration token for one user's install of the native app.
 * The mobile client POSTs its token to `me/device-tokens` after login and
 * DELETEs it on logout; PushService fans notifications out to every token
 * for the target user and prunes any token FCM reports as stale.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // FCM registration tokens are ~160 chars today but not contractually
            // bounded; 512 leaves ample headroom while staying inside MySQL's
            // 3072-byte utf8mb4 unique-index limit (512 * 4 = 2048).
            $table->string('token', 512);
            $table->enum('platform', ['ios', 'android', 'web'])->default('android');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique('token');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
    }
};
