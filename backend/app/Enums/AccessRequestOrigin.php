<?php

namespace App\Enums;

use App\Services\LeadAccessRequestService;

/**
 * Where an access request came from — set once, at creation, from
 * {@see LeadAccessRequestService::request()}. This distinguishes a Banker's
 * approved direct-assignment requests from matched-lead requests. Directly
 * assigned leads start in Assigned Leads and move to Priority Leads after
 * their "Request Full Details" request is approved.
 */
enum AccessRequestOrigin: string
{
    /** "Send Request" from Matched Leads — the lead wasn't assigned to this banker yet when they requested it. */
    case Matched = 'matched';

    /** "Request Full Details" for a lead a Manager assigned to this banker directly. */
    case Priority = 'priority';

    public function label(): string
    {
        return match ($this) {
            self::Matched => 'Matched lead',
            self::Priority => 'Priority lead',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $o): string => $o->value, self::cases());
    }
}
