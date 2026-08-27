<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Settings;
use App\Models\User;
use App\Repositories\Contracts\SettingsRepositoryInterface;

/**
 * Singleton platform settings — General, Matching Engine, Notifications and
 * Security (Phase 1). Replaces the frontend's `SettingsDataProvider` mock;
 * every update is audited the same way the mock recorded to
 * `AuditLogDataProvider`.
 */
class SettingsService extends BaseService
{
    /** The only JSON columns a section update may target. */
    private const SECTIONS = ['general', 'matching_engine', 'notifications', 'security'];

    private const ENTITY_LABELS = [
        'general' => 'General settings',
        'matching_engine' => 'Matching Engine settings',
        'notifications' => 'Notification settings',
        'security' => 'Security settings',
    ];

    public function __construct(
        private readonly SettingsRepositoryInterface $settings,
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function get(): Settings
    {
        return $this->settings->get();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateSection(User $actor, string $section, array $payload): Settings
    {
        if (! in_array($section, self::SECTIONS, true)) {
            throw new DomainException('Unknown settings section.', 422);
        }

        return $this->transaction(function () use ($actor, $section, $payload): Settings {
            $settings = $this->settings->update($this->settings->get(), [$section => $payload]);

            $label = self::ENTITY_LABELS[$section];

            $this->auditLog->record(
                $actor,
                'Updated',
                'Settings',
                $label,
                sprintf('%s updated %s.', $actor->name, mb_strtolower($label)),
                'other',
                $settings->id,
            );

            return $settings;
        });
    }
}
