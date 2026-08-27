<?php

namespace App\Http\Resources;

use App\Models\ConnectorCommission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ConnectorCommission
 */
class ConnectorCommissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'loan_lead' => $this->whenLoaded('loanLead', fn () => [
                'id' => $this->loanLead->id,
                'reference' => $this->loanLead->reference,
                'applicant_name' => $this->loanLead->applicant_name,
            ]),
            'level' => $this->level,
            'source_connector' => $this->sourceConnectorSummary($this->whenLoaded('sourceConnector')),
            'commission_rate' => (float) $this->commission_rate,
            'commission_amount' => (float) $this->commission_amount,
            'status' => $this->status->value,
            'status_label' => $this->statusEnum()->label(),
            'status_colour' => $this->statusEnum()->colour(),
            'accrued_at' => optional($this->accrued_at)->toIso8601String(),
            'paid_at' => optional($this->paid_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function sourceConnectorSummary(mixed $user): ?array
    {
        if (! $user instanceof User) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
}
