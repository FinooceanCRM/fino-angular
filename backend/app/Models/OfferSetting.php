<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Popup configuration — exactly one row. Use {@see self::current()}. */
class OfferSetting extends Model
{
    /** Seconds: [min, max] for each step of the popup schedule. */
    public const FIRST_RANGE = [0, 3600];
    public const SECOND_RANGE = [5, 3600];
    public const REPEAT_RANGE = [30, 86400];

    protected $fillable = ['popup_enabled', 'callback_enabled', 'first_delay_seconds', 'second_delay_seconds', 'repeat_gap_seconds', 'pages', 'updated_by'];

    protected function casts(): array
    {
        return [
            'popup_enabled' => 'boolean',
            'callback_enabled' => 'boolean',
            'first_delay_seconds' => 'integer',
            'second_delay_seconds' => 'integer',
            'repeat_gap_seconds' => 'integer',
            'pages' => 'array',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate([], ['popup_enabled' => false, 'callback_enabled' => true, 'first_delay_seconds' => 15, 'second_delay_seconds' => 120, 'repeat_gap_seconds' => 900, 'pages' => []]);
    }
}
