<?php

namespace App\Http\Requests\Customer;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:191'],
            'email' => ['sometimes', 'required', 'email', 'max:191'],
            'phone' => ['sometimes', 'required', 'string', 'max:32'],
            'segment' => ['sometimes', 'required', Rule::in(['Retail', 'SME', 'Corporate'])],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
