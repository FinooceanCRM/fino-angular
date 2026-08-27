<?php

namespace App\Enums;

enum ConnectorCommissionStatus: string
{
    case Accrued = 'accrued';
    case Paid = 'paid';
    case Reversed = 'reversed';

    public function label(): string
    {
        return match ($this) {
            self::Accrued => 'Accrued',
            self::Paid => 'Paid',
            self::Reversed => 'Reversed',
        };
    }

    public function colour(): string
    {
        return match ($this) {
            self::Accrued => 'accent',
            self::Paid => 'success',
            self::Reversed => 'warn',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $s): string => $s->value, self::cases());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function catalogue(): array
    {
        return array_map(static fn (self $s): array => [
            'value' => $s->value,
            'label' => $s->label(),
            'colour' => $s->colour(),
        ], self::cases());
    }
}
