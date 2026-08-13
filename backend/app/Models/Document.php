<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'loan_lead_id',
        'uploaded_by',
        'document_type',
        'original_name',
        'path',
        'mime_type',
        'size_bytes',
        'status',
    ];

    protected function casts(): array
    {
        return ['size_bytes' => 'integer'];
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
