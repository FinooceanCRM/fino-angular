<?php

namespace App\Enums;

/**
 * Configurable lead status system (Phase 9).
 *
 * The workflow moves a lead from creation (Connector / any hierarchy user)
 * through assignment, processing, bank matching and final outcome.
 */
enum LeadStatus: string
{
    case New = 'new';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case DocumentsPending = 'documents_pending';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Disbursed = 'disbursed';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::Assigned => 'Assigned',
            self::InProgress => 'In Progress',
            self::DocumentsPending => 'Documents Pending',
            self::UnderReview => 'Under Review',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Disbursed => 'Disbursed',
            self::Closed => 'Closed',
        };
    }

    /** Terminal states can no longer transition. */
    public function isTerminal(): bool
    {
        return in_array($this, [self::Closed], true);
    }

    /**
     * Statuses reachable directly from this one via changeStatus(). Any
     * non-terminal status may jump directly to any other status (including
     * Disbursed without stepping through the intermediate statuses first);
     * Closed remains terminal and has no further transitions.
     *
     * @return array<int, self>
     */
    public function allowedNextStatuses(): array
    {
        if ($this->isTerminal()) {
            return [];
        }

        return array_values(array_filter(
            self::cases(),
            fn (self $s): bool => $s !== $this,
        ));
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedNextStatuses(), true);
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $s): string => $s->value, self::cases());
    }

    /**
     * Status catalogue for the frontend (configurable status system).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function catalogue(): array
    {
        return array_map(static fn (self $s): array => [
            'value' => $s->value,
            'label' => $s->label(),
            'is_terminal' => $s->isTerminal(),
            'colour' => $s->colour(),
        ], self::cases());
    }

    public function colour(): string
    {
        return match ($this) {
            self::New => 'default',
            self::Assigned, self::InProgress, self::UnderReview => 'primary',
            self::DocumentsPending => 'accent',
            self::Approved, self::Disbursed => 'success',
            self::Rejected => 'warn',
            self::Closed => 'default',
        };
    }
}
