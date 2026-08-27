<?php

namespace App\Repositories\Contracts;

use App\Models\Settings;

interface SettingsRepositoryInterface
{
    /** Always returns the singleton row (id=1), creating it if it somehow doesn't exist. */
    public function get(): Settings;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Settings $settings, array $attributes): Settings;
}
