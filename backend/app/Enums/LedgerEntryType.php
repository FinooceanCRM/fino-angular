<?php

namespace App\Enums;

/**
 * Accounting ledger entry kinds (Phase 2). Mirrors the frontend's
 * `LedgerEntryType` union in commission.model.ts — keep both in sync.
 */
enum LedgerEntryType: string
{
    case Disbursement = 'disbursement';
    case ConnectorCommissionAccrued = 'connector_commission_accrued';
    case ConnectorCommissionPaid = 'connector_commission_paid';
    case AffiliateCommissionAccrued = 'affiliate_commission_accrued';
    case AffiliateCommissionPaid = 'affiliate_commission_paid';

    public function label(): string
    {
        return match ($this) {
            self::Disbursement => 'Disbursement',
            self::ConnectorCommissionAccrued => 'Connector commission accrued',
            self::ConnectorCommissionPaid => 'Connector commission paid',
            self::AffiliateCommissionAccrued => 'Affiliate commission accrued',
            self::AffiliateCommissionPaid => 'Affiliate commission paid',
        };
    }

    /**
     * Entries of this type carry the ledger balance forward unchanged
     * (shown for context only) — currently just disbursements. Every other
     * type moves the running "commission payable" balance: `_accrued` types
     * add `credit`, `_paid` types subtract `debit`.
     */
    public function affectsBalance(): bool
    {
        return $this !== self::Disbursement;
    }

    public static function labelFor(string $value): string
    {
        return self::tryFrom($value)?->label() ?? $value;
    }
}
