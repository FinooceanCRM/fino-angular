<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalComment extends Model
{
    use HasFactory;

    /** created_at only — comments are never edited, mirroring CustomerNote. */
    const UPDATED_AT = null;

    protected $fillable = [
        'approval_id',
        'author_id',
        'body',
    ];

    public function approval(): BelongsTo
    {
        return $this->belongsTo(Approval::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
