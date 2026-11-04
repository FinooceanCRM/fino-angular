<?php

namespace App\Enums;

/**
 * Where a lead originated. Stored on `loan_leads.source`.
 *
 * Website, CustomerPortal and the two offer sources feed the Customer Inquiries queue.
 */
enum InquirySource: string
{
    case Internal = 'internal';
    case PublicReferral = 'public_referral';
    case Website = 'website';
    case CustomerPortal = 'customer_portal';
    /** Guest visitor claimed an offer from the timed popup. */
    case OfferPopup = 'offer_popup';
    /** Visitor filled the offer form straight on the offer landing page. */
    case OfferLanding = 'offer_landing';
    /** Guest shared their details in the small popup shown when the website is first opened (no offer involved). */
    case CallbackPopup = 'callback_popup';

    public function label(): string
    {
        return match ($this) {
            self::Internal => 'Internal CRM',
            self::PublicReferral => 'Referral Link',
            self::Website => 'Public Website',
            self::CustomerPortal => 'Customer Portal',
            self::OfferPopup => 'Guest Visitor Popup',
            self::OfferLanding => 'Offer Landing Page',
            self::CallbackPopup => 'Website Details Popup',
        };
    }

    /** @return array<int, string> */
    public static function inquiryValues(): array
    {
        return [self::Website->value, self::CustomerPortal->value, self::OfferPopup->value, self::OfferLanding->value, self::CallbackPopup->value];
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
