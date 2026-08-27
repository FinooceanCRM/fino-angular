<?php

namespace App\Http\Resources;

use App\Models\Settings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Settings
 */
class SettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'general' => $this->general ?? [],
            'matching_engine' => $this->matching_engine ?? [],
            'notifications' => $this->notifications ?? [],
            'security' => $this->security ?? [],
        ];
    }
}
