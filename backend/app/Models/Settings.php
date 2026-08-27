<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Singleton settings document — exactly one row (id=1) ever exists. Each
 * column is a JSON blob for one settings section; see
 * {@see \App\Services\SettingsService}.
 */
class Settings extends Model
{
    protected $table = 'settings';

    protected $fillable = [
        'general',
        'matching_engine',
        'notifications',
        'security',
    ];

    protected function casts(): array
    {
        return [
            'general' => 'array',
            'matching_engine' => 'array',
            'notifications' => 'array',
            'security' => 'array',
        ];
    }
}
