<?php

namespace App\Http\Resources;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Notification
 */
class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data ?? [],
            'read_at' => optional($this->read_at)->toIso8601String(),
            'is_read' => $this->read_at !== null,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
