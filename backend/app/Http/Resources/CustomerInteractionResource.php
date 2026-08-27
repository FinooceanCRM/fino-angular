<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CustomerInteraction
 */
class CustomerInteractionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'icon' => $this->icon,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
