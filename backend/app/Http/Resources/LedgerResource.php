<?php

namespace App\Http\Resources;

use App\Enums\LedgerEntryType;
use App\Models\LedgerEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LedgerEntry
 */
class LedgerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => optional($this->date)->toDateString(),
            'type' => $this->type,
            'type_label' => LedgerEntryType::labelFor((string) $this->type),
            'description' => $this->description,
            'debit' => $this->debit !== null ? (float) $this->debit : null,
            'credit' => $this->credit !== null ? (float) $this->credit : null,
            // Set by LedgerService::paginate() as a computed attribute, not
            // a DB column — absent (null) if this resource is ever built
            // from a row fetched some other way.
            'balance' => $this->balance !== null ? round((float) $this->balance, 2) : null,
        ];
    }
}
