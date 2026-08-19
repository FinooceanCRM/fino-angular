<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'manager_id' => $this->manager_id,
            'relationship_manager_id' => $this->relationship_manager_id,
            'employee_id' => $this->employee_id,
            'department' => $this->department?->value,
            'department_label' => $this->department?->label(),
            'phone' => $this->phone,
            'is_active' => (bool) $this->is_active,
            'email_notifications' => (bool) $this->email_notifications,
            'sms_notifications' => (bool) $this->sms_notifications,
            'notify_on_assignment' => (bool) $this->notify_on_assignment,
            'notify_on_approval' => (bool) $this->notify_on_approval,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
