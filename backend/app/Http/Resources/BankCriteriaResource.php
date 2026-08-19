<?php

namespace App\Http\Resources;

use App\Models\BankCriteria;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BankCriteria
 */
class BankCriteriaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bank_name' => $this->bank_name,
            'product_name' => $this->product_name,
            'loan_type' => $this->loan_type,
            'min_loan_amount' => (float) $this->min_loan_amount,
            'max_loan_amount' => $this->max_loan_amount !== null ? (float) $this->max_loan_amount : null,
            'min_monthly_income' => (float) $this->min_monthly_income,
            'min_credit_score' => $this->min_credit_score,
            'min_age' => $this->min_age,
            'max_age' => $this->max_age,
            'employment_type' => $this->employment_type,
            'interest_rate' => $this->interest_rate !== null ? (float) $this->interest_rate : null,
            'eligibility_rules' => $this->eligibility_rules ?? [],
            'is_active' => (bool) $this->is_active,
            'banker_id' => $this->banker_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
