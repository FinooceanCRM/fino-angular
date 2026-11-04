<?php

namespace App\Http\Requests\Portal;

use App\Http\Requests\BaseFormRequest;

/** Only name and phone are editable; email/identity changes need verification (not built yet). */
class UpdateCustomerProfileRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:191'],
            'phone' => ['required', 'string', 'regex:/^[0-9+\-\s()]{10,16}$/'],
        ];
    }
}
