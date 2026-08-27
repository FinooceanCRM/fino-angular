<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Settings\UpdateGeneralSettingsRequest;
use App\Http\Requests\Settings\UpdateMatchingEngineSettingsRequest;
use App\Http\Requests\Settings\UpdateNotificationSettingsRequest;
use App\Http\Requests\Settings\UpdateSecuritySettingsRequest;
use App\Http\Resources\SettingsResource;
use App\Models\Settings;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends BaseApiController
{
    public function __construct(private readonly SettingsService $settings)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $this->authorize('view', Settings::class);

        return $this->respondSuccess((new SettingsResource($this->settings->get()))->resolve($request));
    }

    public function updateGeneral(UpdateGeneralSettingsRequest $request): JsonResponse
    {
        $this->authorize('update', Settings::class);

        $settings = $this->settings->updateSection($request->user(), 'general', $request->validated());

        return $this->respondSuccess(
            (new SettingsResource($settings))->resolve($request),
            'General settings updated.',
        );
    }

    public function updateMatchingEngine(UpdateMatchingEngineSettingsRequest $request): JsonResponse
    {
        $this->authorize('update', Settings::class);

        $settings = $this->settings->updateSection($request->user(), 'matching_engine', $request->validated());

        return $this->respondSuccess(
            (new SettingsResource($settings))->resolve($request),
            'Matching engine settings updated.',
        );
    }

    public function updateNotifications(UpdateNotificationSettingsRequest $request): JsonResponse
    {
        $this->authorize('update', Settings::class);

        $settings = $this->settings->updateSection($request->user(), 'notifications', $request->validated());

        return $this->respondSuccess(
            (new SettingsResource($settings))->resolve($request),
            'Notification settings updated.',
        );
    }

    public function updateSecurity(UpdateSecuritySettingsRequest $request): JsonResponse
    {
        $this->authorize('update', Settings::class);

        $settings = $this->settings->updateSection($request->user(), 'security', $request->validated());

        return $this->respondSuccess(
            (new SettingsResource($settings))->resolve($request),
            'Security settings updated.',
        );
    }
}
