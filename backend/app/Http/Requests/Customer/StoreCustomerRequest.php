<?php

namespace App\Http\Requests\Customer;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['required', 'string', 'max:32'],
            'segment' => ['required', Rule::in(['Retail', 'SME', 'Corporate'])],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
