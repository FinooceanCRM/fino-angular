<?php

namespace App\Models;

use App\Enums\LedgerEntryType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Accounting ledger row (Phase 2). Written exclusively via
 * {@see \App\Services\LedgerService::record()} — see that service for the
 * disbursement / commission-accrual / commission-paid write points.
 */
class LedgerEntry extends Model
{
    use HasFactory;

    protected $table = 'ledger_entries';

    protected $fillable = [
        'date',
        'type',
        'description',
        'debit',
        'credit',
        'related_type',
        'related_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'related_id' => 'integer',
        ];
    }

    public function typeEnum(): ?LedgerEntryType
    {
        return LedgerEntryType::tryFrom((string) $this->type);
    }
}
