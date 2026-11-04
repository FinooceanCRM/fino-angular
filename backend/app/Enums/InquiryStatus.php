<?php

namespace App\Enums;

/**
 * Telecaller processing state of a website/portal inquiry. Deliberately
 * separate from {@see LeadStatus}: the lead's workflow status stays under the
 * existing CRM rules, this only tracks the qualification call-back stage.
 */
enum InquiryStatus: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case FollowUp = 'follow_up';
    case Interested = 'interested';
    case NotReachable = 'not_reachable';
    case NotInterested = 'not_interested';
    case Assigned = 'assigned';
    /** The visitor became a customer (e.g. booked a consultation or applied). */
    case Converted = 'converted';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::Contacted => 'Contacted',
            self::FollowUp => 'Follow-up Scheduled',
            self::Interested => 'Interested',
            self::NotReachable => 'Not Reachable',
            self::NotInterested => 'Not Interested',
            self::Assigned => 'Assigned to Manager',
            self::Converted => 'Converted',
        };
    }

    /** Statuses a telecaller may set by hand (Assigned only happens through assignment). */
    public static function settable(): array
    {
        return array_values(array_filter(
            self::cases(),
            static fn (self $s): bool => $s !== self::Assigned && $s !== self::New,
        ));
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(static fn (self $s): string => $s->value, self::cases());
    }

    /** @return array<int, array<string, string>> */
    public static function catalogue(): array
    {
        return array_map(static fn (self $s): array => [
            'value' => $s->value,
            'label' => $s->label(),
        ], self::cases());
    }
}
