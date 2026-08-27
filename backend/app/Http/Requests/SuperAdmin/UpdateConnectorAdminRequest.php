<?php

namespace App\Http\Requests\SuperAdmin;

use App\Enums\ConnectorStatus;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateConnectorAdminRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'commission_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999.99'],
            'status' => ['sometimes', Rule::in(ConnectorStatus::values())],
        ];
    }
}
