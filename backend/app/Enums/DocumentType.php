<?php

namespace App\Enums;

enum DocumentType: string
{
    case Aadhaar = 'aadhaar';
    case Pan = 'pan';
    case BankStatement = 'bank_statement';
    case IncomeProof = 'income_proof';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Aadhaar => 'Aadhaar',
            self::Pan => 'PAN',
            self::BankStatement => 'Bank Statement',
            self::IncomeProof => 'Income Proof',
            self::Other => 'Other Document',
        };
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
