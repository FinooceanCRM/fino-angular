<?php

namespace App\Enums;

enum ConnectorStatus: string
{
    case PendingVerification = 'pending_verification';
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::PendingVerification => 'Pending Verification',
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Suspended => 'Suspended',
        };
    }

    public function colour(): string
    {
        return match ($this) {
            self::PendingVerification => 'accent',
            self::Active => 'success',
            self::Inactive => 'default',
            self::Suspended => 'warn',
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
