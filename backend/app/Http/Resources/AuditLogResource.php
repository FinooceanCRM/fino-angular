<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AuditLog
 */
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'timestamp' => optional($this->created_at)->toIso8601String(),
            'actor_name' => $this->actor_name,
            'actor_role' => $this->actor_role,
            'action' => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'entity_label' => $this->entity_label,
            'description' => $this->description,
            'category' => $this->category,
            'ip_address' => $this->ip_address,
        ];
    }
}
