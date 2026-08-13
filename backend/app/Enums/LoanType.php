<?php

namespace App\Enums;

enum LoanType: string
{
    case Home = 'home';
    case Personal = 'personal';
    case Business = 'business';
    case Auto = 'auto';
    case Education = 'education';
    case LoanAgainstProperty = 'loan_against_property';

    public function label(): string
    {
        return match ($this) {
            self::Home => 'Home Loan',
            self::Personal => 'Personal Loan',
            self::Business => 'Business Loan',
            self::Auto => 'Auto Loan',
            self::Education => 'Education Loan',
            self::LoanAgainstProperty => 'Loan Against Property',
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
