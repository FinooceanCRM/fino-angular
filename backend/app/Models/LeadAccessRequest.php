<?php

namespace App\Models;

use App\Enums\AccessRequestOrigin;
use App\Enums\AccessRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadAccessRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_lead_id',
        'banker_id',
        'origin',
        'status',
        'remarks',
        'decision_remarks',
        'decided_by',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'origin' => AccessRequestOrigin::class,
            'status' => AccessRequestStatus::class,
            'decided_at' => 'datetime',
        ];
    }

    public function statusEnum(): AccessRequestStatus
    {
        return $this->status instanceof AccessRequestStatus
            ? $this->status
            : AccessRequestStatus::from((string) $this->status);
    }

    public function originEnum(): AccessRequestOrigin
    {
        return $this->origin instanceof AccessRequestOrigin
            ? $this->origin
            : AccessRequestOrigin::from((string) $this->origin);
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function banker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'banker_id');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    /**
     * Whether a banker has been granted full access to a lead's contact
     * details, documents and update rights — i.e. whether an approved
     * access request exists for this (lead, banker) pair. The single
     * source of truth for the Banker access-control matrix: masking,
     * status-change rights, document access and the Update button all key
     * off this.
     */
    public static function grantsFullAccess(int $loanLeadId, int $bankerId): bool
    {
        return self::query()
            ->where('loan_lead_id', $loanLeadId)
            ->where('banker_id', $bankerId)
            ->where('status', AccessRequestStatus::Approved->value)
            ->exists();
    }

    /**
     * Whether this banker reached the lead via their own approved
     * "Send Request" from Matched Leads — the one thing that actually
     * graduates a lead out of Priority Leads and into Assigned Leads (a
     * Manager assigning it directly, even with a later approved "Request
     * Full Details", is not enough — see {@see AccessRequestOrigin}).
     */
    public static function approvedFromMatched(int $loanLeadId, int $bankerId): bool
    {
        return self::query()
            ->where('loan_lead_id', $loanLeadId)
            ->where('banker_id', $bankerId)
            ->where('status', AccessRequestStatus::Approved->value)
            ->where('origin', AccessRequestOrigin::Matched->value)
            ->exists();
    }
}
