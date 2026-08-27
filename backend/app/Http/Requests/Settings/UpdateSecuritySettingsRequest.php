<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\BaseFormRequest;

class UpdateSecuritySettingsRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'session_timeout_minutes' => ['required', 'integer', 'min:5', 'max:1440'],
            'min_password_length' => ['required', 'integer', 'min:6', 'max:64'],
            'require_special_character' => ['required', 'boolean'],
            'require_number' => ['required', 'boolean'],
            'two_factor_required' => ['required', 'boolean'],
            'max_login_attempts' => ['required', 'integer', 'min:1', 'max:20'],
            'ip_allowlist_enabled' => ['required', 'boolean'],
            'ip_allowlist' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
