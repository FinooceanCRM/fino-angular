<?php

namespace App\Support;

use App\Enums\LeadStatus;

/**
 * The only translation between internal {@see LeadStatus} values and what a
 * customer is allowed to see. Internal statuses and remarks are never sent to
 * the customer portal — only the label, message and step below.
 *
 * Customers can never set a status; this mapping is read-only.
 */
final class CustomerFacingStatus
{
    /** Progress steps shown on the application tracker. */
    public const STEPS = [
        'submitted' => 'Application Submitted',
        'documents' => 'Document Verification',
        'review' => 'Lender Review',
        'decision' => 'Decision',
        'completed' => 'Completed',
    ];

    /**
     * @return array{key: string, label: string, message: string, step: int, tone: string, action_required: bool}
     */
    public static function for(LeadStatus $status): array
    {
        return match ($status) {
            LeadStatus::New => self::row('inquiry_received', 'Inquiry Received', 'We have received your request. An advisor will contact you shortly.', 0, 'neutral'),
            LeadStatus::Assigned => self::row('under_review', 'Under Review', 'Your request has been assigned to our team for review.', 1, 'info'),
            LeadStatus::DocumentsPending => self::row('documents_required', 'Documents Required', 'Please upload the requested documents so we can continue.', 1, 'warning', true),
            LeadStatus::InProgress => self::row('processing', 'Processing', 'Our team is working on your application.', 2, 'info'),
            LeadStatus::UnderReview => self::row('under_review', 'Under Review', 'Your application is being reviewed with our lending partners.', 2, 'info'),
            LeadStatus::Approved => self::row('decision', 'Decision Communicated', 'A decision on your application is available. Your advisor will share the details.', 3, 'success'),
            LeadStatus::Rejected => self::row('decision', 'Decision Communicated', 'A decision on your application has been made. Your advisor will walk you through it.', 3, 'neutral'),
            LeadStatus::Disbursed => self::row('completed', 'Completed', 'Your loan process has been completed.', 4, 'success'),
            LeadStatus::Closed => self::row('completed', 'Completed', 'This application has been closed.', 4, 'neutral'),
        };
    }

    /** @return array<int, array{key: string, label: string}> */
    public static function steps(): array
    {
        $out = [];
        foreach (self::STEPS as $key => $label) {
            $out[] = ['key' => $key, 'label' => $label];
        }

        return $out;
    }

    /** @return array{key: string, label: string, message: string, step: int, tone: string, action_required: bool} */
    private static function row(string $key, string $label, string $message, int $step, string $tone, bool $action = false): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'message' => $message,
            'step' => $step,
            'tone' => $tone,
            'action_required' => $action,
        ];
    }
}
