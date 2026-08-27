<?php

namespace App\Http\Requests\CustomerNote;

use App\Http\Requests\BaseFormRequest;

class StoreCustomerNoteRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:5000'],
        ];
    }
}
