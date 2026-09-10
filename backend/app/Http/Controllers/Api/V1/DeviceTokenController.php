<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Registration of the native app's FCM token for the signed-in user. The
 * mobile client calls `store` after login and `destroy` on logout; the same
 * token registered by another user is reassigned (updateOrCreate on the
 * unique `token` column), so a shared device never keeps a stale owner.
 */
class DeviceTokenController extends BaseApiController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:512'],
            'platform' => ['required', Rule::in(['ios', 'android', 'web'])],
        ]);

        DeviceToken::query()->updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'],
                'last_used_at' => now(),
            ],
        );

        return $this->respondSuccess(null, 'Device registered for notifications.');
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        DeviceToken::query()
            ->where('user_id', $request->user()->id)
            ->where('token', $validated['token'])
            ->delete();

        return $this->respondSuccess(null, 'Device unregistered.');
    }
}
