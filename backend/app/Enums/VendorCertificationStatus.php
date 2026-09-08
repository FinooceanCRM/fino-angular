<?php

namespace App\Enums;

/**
 * Lifecycle of a Vendor Certification.
 *
 * `draft`     — the vendor is still filling the survey wizard (one open draft
 *               per vendor; upserted as they move between steps / hit "Save
 *               draft"). Not yet a real certification.
 * `pending`   — submitted, awaiting review (kept for parity with the source
 *               Customer Survey's status set; nothing auto-transitions here
 *               in this phase).
 * `completed` — submitted and certified; the downloadable certificate is
 *               available. This is the status a fresh submission lands in,
 *               matching the source survey's `submit.php`.
 * `rejected`  — reviewed and rejected.
 */
enum VendorCertificationStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Completed = 'completed';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Pending => 'Pending',
            self::Completed => 'Completed',
            self::Rejected => 'Rejected',
        };
    }

    public function colour(): string
    {
        return match ($this) {
            self::Draft => 'default',
            self::Pending => 'accent',
            self::Completed => 'success',
            self::Rejected => 'warn',
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
