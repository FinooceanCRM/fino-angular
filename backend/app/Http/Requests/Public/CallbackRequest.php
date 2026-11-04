<?php

namespace App\Http\Requests\Public;

use App\Http\Requests\BaseFormRequest;

/** The small "share your details" popup: name, mobile and city, plus the privacy tick. Nothing else is asked. */
class CallbackRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100', "regex:/^[\\pL][\\pL .'\\-]*$/u"],
            'phone' => ['required', 'string', 'regex:/^[6-9]\\d{9}$/'],
            'city' => ['required', 'string', 'min:2', 'max:100', "regex:/^[\\pL][\\pL .'\\-]*$/u"],
            'privacy_consent' => ['accepted'],
            'visitor_id' => ['nullable', 'string', 'regex:/^[0-9a-fA-F\\-]{16,64}$/'],
            'website' => ['nullable', 'string', 'max:255'],
            'elapsed_ms' => ['nullable', 'integer', 'min:0', 'max:86400000'],
            'captcha_token' => ['nullable', 'string', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'Please enter your name using letters only.',
            'phone.regex' => 'Enter a valid 10-digit mobile number.',
            'city.regex' => 'Please enter your city using letters only.',
            'privacy_consent.accepted' => 'Please accept the privacy notice so we can keep your details.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        foreach (['name', 'city'] as $k) {
            if (is_string($this->input($k))) {
                $merge[$k] = trim(strip_tags($this->input($k)));
            }
        }
        if (is_string($this->input('phone'))) {
            $digits = preg_replace('/[\\s\\-()]+/', '', $this->input('phone')) ?? '';
            $merge['phone'] = preg_replace('/^(\\+?91|0)(?=[6-9]\\d{9}$)/', '', $digits) ?? $digits;
        }
        $this->merge($merge);
    }
}
