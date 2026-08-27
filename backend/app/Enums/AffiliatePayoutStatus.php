<?php

namespace App\Enums;

enum AffiliatePayoutStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Paid = 'paid';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::Paid => 'Paid',
            self::Failed => 'Failed',
        };
    }

    public function colour(): string
    {
        return match ($this) {
            self::Pending => 'accent',
            self::Processing => 'primary',
            self::Paid => 'success',
            self::Failed => 'warn',
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
