<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One entry on an inquiry's internal timeline. `type` is one of
 * note | contact | status | follow_up | assignment | resubmission | created.
 * Never exposed to customers.
 */
class InquiryActivity extends Model
{
    protected $fillable = ['loan_lead_id', 'user_id', 'type', 'body', 'meta'];

    protected function casts(): array
    {
        return ['meta' => 'array'];
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
