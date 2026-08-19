<?php

namespace App\Enums;

use App\Services\LeadAccessRequestService;

/**
 * Where an access request came from — set once, at creation, from
 * {@see LeadAccessRequestService::request()}. This is what
 * actually distinguishes a Banker's Priority Leads from their Assigned
 * Leads (both have `assigned_banker_id` set to the banker): a lead stays a
 * Priority Lead for as long as it lives — even after a later "Request Full
 * Details" is approved — unless the banker reached it by requesting a
 * Matched Lead themselves.
 */
enum AccessRequestOrigin: string
{
    /** "Send Request" from Matched Leads — the lead wasn't assigned to this banker yet when they requested it. */
    case Matched = 'matched';

    /** "Request Full Details" from Priority Leads — a Manager had already assigned the lead to this banker directly. */
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
