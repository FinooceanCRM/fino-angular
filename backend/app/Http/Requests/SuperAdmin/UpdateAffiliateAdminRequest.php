<?php

namespace App\Http\Requests\SuperAdmin;

use App\Enums\AffiliateStatus;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateAffiliateAdminRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'commission_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999.99'],
            'status' => ['sometimes', Rule::in(AffiliateStatus::values())],
        ];
    }
}
