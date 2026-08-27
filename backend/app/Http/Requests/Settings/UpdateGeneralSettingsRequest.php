<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\BaseFormRequest;

class UpdateGeneralSettingsRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company' => ['required', 'array'],
            'company.company_name' => ['required', 'string', 'max:191'],
            'company.support_email' => ['required', 'email', 'max:191'],
            'company.support_phone' => ['required', 'string', 'max:32'],
            'company.address' => ['required', 'string', 'max:500'],
            'company.currency' => ['required', 'string', 'max:8'],

            'branding' => ['required', 'array'],
            'branding.primary_color' => ['required', 'string', 'max:16'],
            'branding.logo_url' => ['required', 'string', 'max:500'],
            'branding.favicon_url' => ['required', 'string', 'max:500'],
            'branding.tagline' => ['required', 'string', 'max:191'],

            'email' => ['required', 'array'],
            'email.from_name' => ['required', 'string', 'max:191'],
            'email.from_email' => ['required', 'email', 'max:191'],
            'email.reply_to_email' => ['required', 'email', 'max:191'],
            'email.footer_text' => ['required', 'string', 'max:500'],

            'regional' => ['required', 'array'],
            'regional.timezone' => ['required', 'string', 'max:64'],
            'regional.date_format' => ['required', 'string', 'max:32'],
            'regional.business_hours' => ['required', 'string', 'max:191'],

            'platform' => ['required', 'array'],
            'platform.default_page_size' => ['required', 'integer', 'min:5', 'max:100'],
            'platform.maintenance_mode' => ['required', 'boolean'],
        ];
    }
}
