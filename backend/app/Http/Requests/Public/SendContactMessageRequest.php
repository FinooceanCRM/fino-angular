<?php

namespace App\Http\Requests\Public;

use App\Http\Requests\BaseFormRequest;

class SendContactMessageRequest extends BaseFormRequest
{
    /** Inquiry types offered by the contact form. */
    public const TYPES = [
        'General Inquiry', 'Personal Loan', 'Business Loan', 'Home Loan', 'Loan Against Property',
        'Car Loan', 'Education Loan', 'Government Loans', 'Other',
    ];

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:191'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['required', 'string', 'regex:/^[0-9+\-\s()]{10,16}$/'],
            'inquiry_type' => ['required', 'in:'.implode(',', self::TYPES)],
            'message' => ['required', 'string', 'min:5', 'max:3000'],
            'consent' => ['accepted'],
            // Honeypot, same convention as the other public forms.
            'website' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid mobile number.',
            'consent.accepted' => 'Please accept the Terms and Privacy Policy.',
        ];
    }
}
