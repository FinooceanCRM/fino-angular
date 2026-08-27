<?php

namespace App\Policies;

use App\Models\Settings;
use App\Models\User;

/** Platform settings are Super Admin only — a single-tenant admin settings page. */
class SettingsPolicy
{
    public function view(User $actor): bool
    {
        return $actor->hasRole('super_admin');
    }

    public function update(User $actor): bool
    {
        return $actor->hasRole('super_admin');
    }
}
