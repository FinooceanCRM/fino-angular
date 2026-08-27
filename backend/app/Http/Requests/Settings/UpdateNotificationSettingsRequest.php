<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateNotificationSettingsRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email_enabled' => ['required', 'boolean'],
            'sms_enabled' => ['required', 'boolean'],
            'push_enabled' => ['required', 'boolean'],
            'digest_frequency' => ['required', Rule::in(['real_time', 'daily', 'weekly'])],

            'category_channels' => ['required', 'array'],
            'category_channels.leads' => ['required', 'boolean'],
            'category_channels.users' => ['required', 'boolean'],
            'category_channels.banking' => ['required', 'boolean'],
            'category_channels.documents' => ['required', 'boolean'],
            'category_channels.commission' => ['required', 'boolean'],
            'category_channels.system' => ['required', 'boolean'],
        ];
    }
}
