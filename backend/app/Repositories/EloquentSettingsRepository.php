<?php

namespace App\Repositories;

use App\Models\Settings;
use App\Repositories\Contracts\SettingsRepositoryInterface;

class EloquentSettingsRepository implements SettingsRepositoryInterface
{
    public function get(): Settings
    {
        return Settings::query()->firstOrCreate(['id' => 1], [
            'general' => [],
            'matching_engine' => [],
            'notifications' => [],
            'security' => [],
        ]);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Settings $settings, array $attributes): Settings
    {
        $settings->fill($attributes)->save();

        return $settings->refresh();
    }
}
