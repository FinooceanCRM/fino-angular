<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseFormRequest;

class UpdatePreferencesRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email_notifications' => ['sometimes', 'boolean'],
            'sms_notifications' => ['sometimes', 'boolean'],
            'notify_on_assignment' => ['sometimes', 'boolean'],
            'notify_on_approval' => ['sometimes', 'boolean'],
        ];
    }
}
