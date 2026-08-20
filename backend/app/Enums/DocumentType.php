<?php

namespace App\Enums;

enum DocumentType: string
{
    case Aadhaar = 'aadhaar';
    case AadhaarFront = 'aadhaar_front';
    case AadhaarBack = 'aadhaar_back';
    case Pan = 'pan';
    case PanCard = 'pan_card';
    case BankStatement = 'bank_statement';
    case IncomeProof = 'income_proof';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Aadhaar => 'Aadhaar',
            self::AadhaarFront => 'Aadhaar Front',
            self::AadhaarBack => 'Aadhaar Back',
            self::Pan => 'PAN',
            self::PanCard => 'PAN Card',
            self::BankStatement => 'Bank Statement',
            self::IncomeProof => 'Income Proof',
            self::Other => 'Other Document',
        };
    }

    /** The three document types every lead-creation flow must collect (Attach Documents step). */
    public static function leadCreationRequiredTypes(): array
    {
        return [self::AadhaarFront, self::AadhaarBack, self::PanCard];
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $t): string => $t->value, self::cases());
    }

    /**
     * @return array<int, array<string, string>>
     */
    public static function catalogue(): array
    {
        return array_map(static fn (self $t): array => [
            'value' => $t->value,
            'label' => $t->label(),
        ], self::cases());
    }
}
