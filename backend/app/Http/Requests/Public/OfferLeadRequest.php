<?php

namespace App\Http\Requests\Public;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

/** The offer landing-page form. Four required fields, two optional, a required privacy tick and an optional marketing tick. */
class OfferLeadRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $services = collect(config('loan_products.products'))->pluck('slug')->all();

        return [
            'name' => ['required', 'string', 'min:2', 'max:100', "regex:/^[\\pL][\\pL .'\\-]*$/u"],
            'phone' => ['required', 'string', 'regex:/^[6-9]\\d{9}$/'],
            'email' => ['required', 'string', 'email:rfc', 'max:191'],
            'city' => ['required', 'string', 'min:2', 'max:100', "regex:/^[\\pL][\\pL .'\\-]*$/u"],
            'interested_service' => ['nullable', 'string', Rule::in($services)],
            'message' => ['nullable', 'string', 'max:500'],
            'privacy_consent' => ['accepted'],
            'marketing_consent' => ['nullable', 'boolean'],
            'visitor_id' => ['nullable', 'string', 'regex:/^[0-9a-fA-F\\-]{16,64}$/'],
            'entry' => ['nullable', Rule::in(['popup', 'landing'])],
            // Spam traps: a hidden field only bots fill in, and how long the form was open.
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
            'privacy_consent.accepted' => 'Please accept the privacy notice so we can contact you.',
        ];
    }

    /** Tidy what people paste: markup removed, +91 / spaces / dashes dropped from the number. */
    protected function prepareForValidation(): void
    {
        $merge = [];
        foreach (['name', 'city', 'message', 'email'] as $k) {
            if (is_string($this->input($k))) {
                $merge[$k] = trim(strip_tags($this->input($k)));
            }
        }
        if (is_string($this->input('phone'))) {
            $digits = preg_replace('/[\\s\\-()]+/', '', $this->input('phone')) ?? '';
            $digits = preg_replace('/^(\\+?91|0)(?=[6-9]\\d{9}$)/', '', $digits) ?? $digits;
            $merge['phone'] = $digits;
        }
        $this->merge($merge);
    }
}
