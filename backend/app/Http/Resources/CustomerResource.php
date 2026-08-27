<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Customer
 */
class CustomerResource extends JsonResource
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
            'phone' => $this->phone,
            'segment' => $this->segment,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_by' => $this->userSummary($this->whenLoaded('creator')),
            'linked_leads' => $this->whenLoaded('leads', fn (): array => $this->leads->map(static fn (LoanLead $lead): array => [
                'id' => $lead->id,
                'reference' => $lead->reference,
                'applicant_name' => $lead->applicant_name,
            ])->all()),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function userSummary(mixed $user): ?array
    {
        if (! $user instanceof User) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
        ];
    }
}
