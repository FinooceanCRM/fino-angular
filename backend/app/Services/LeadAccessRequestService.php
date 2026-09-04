<?php

namespace App\Services;

use App\Enums\AccessRequestOrigin;
use App\Enums\AccessRequestStatus;
use App\Exceptions\DomainException;
use App\Models\LeadAccessRequest;
use App\Models\LeadMatch;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use App\Repositories\EloquentLoanLeadRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Bankers request full access to a lead — either one matched against their
 * own bank_criteria ("Send Request" from Matched Leads) or one a Manager
 * already assigned to them directly ("Request Full Details" from Priority
 * Leads). A Manager/RM/Super Admin who can see the lead approves or rejects
 * it. Approval reuses LeadService::assign() rather than duplicating the
 * assignment logic. An approved request is also the single "full access"
 * flag consulted everywhere else (masking, policies) via
 * {@see LeadAccessRequest::grantsFullAccess()} — regardless of origin.
 * Origin itself (which of the two started the request) is recorded once,
 * at creation, and is what the Banker workspace's bucket split (Priority
 * vs Assigned Leads) uses after approval — see
 * {@see EloquentLoanLeadRepository::applyBankerBucket()}.
 */
class LeadAccessRequestService extends BaseService
{
    public function __construct(
        private readonly LeadService $leadService,
        private readonly NotificationService $notifications,
        private readonly LoanLeadRepositoryInterface $leads,
    ) {}

    public function request(User $banker, LoanLead $lead, ?string $remarks = null): LeadAccessRequest
    {
        // Two legitimate origins for a request: (a) a Matched Lead — scored
        // against one of the banker's own bank_criteria ("Send Request"), or
        // (b) a Priority Lead a Manager already pushed to this banker
        // directly ("Request Full Details" — may have no LeadMatch row at
        // all, since it didn't arrive via matching).
        $hasMatch = LeadMatch::query()
            ->where('loan_lead_id', $lead->id)
            ->whereHas('bankCriteria', fn ($q) => $q->where('banker_id', $banker->id))
            ->exists();

        $alreadyAssignedToMe = $lead->assigned_banker_id === $banker->id;

        if (! $hasMatch && ! $alreadyAssignedToMe) {
            throw new DomainException('This lead is not currently matched against any of your bank criteria.', 422);
        }

        // Already assigned wins over matched when both are true — a lead a
        // Manager handed to this banker directly moves to Priority Leads
        // only after this request is approved.
        $origin = $alreadyAssignedToMe ? AccessRequestOrigin::Priority : AccessRequestOrigin::Matched;

        $duplicate = LeadAccessRequest::query()
            ->where('loan_lead_id', $lead->id)
            ->where('banker_id', $banker->id)
            ->where('status', AccessRequestStatus::Pending->value)
            ->exists();

        if ($duplicate) {
            throw new DomainException('You already have a pending access request for this lead.', 422);
        }

        return $this->transaction(function () use ($banker, $lead, $remarks, $origin): LeadAccessRequest {
            $request = LeadAccessRequest::query()->create([
                'loan_lead_id' => $lead->id,
                'banker_id' => $banker->id,
                'origin' => $origin->value,
                'status' => AccessRequestStatus::Pending->value,
                'remarks' => $remarks,
            ]);

            $this->notifications->notifyMany(
                [$lead->assigned_manager_id, $lead->assigned_relationship_manager_id],
                'lead.access_requested',
                'Bank access request',
                sprintf('%s requested access to lead %s.', $banker->name, $lead->reference),
                ['lead_id' => $lead->id, 'access_request_id' => $request->id],
            );

            return $request;
        });
    }

    public function approve(User $actor, LeadAccessRequest $request, ?string $remarks = null): LeadAccessRequest
    {
        $this->guardPending($request);

        return $this->transaction(function () use ($actor, $request, $remarks): LeadAccessRequest {
            $lead = $this->leads->findVisible($actor, $request->loan_lead_id)
                ?? LoanLead::query()->findOrFail($request->loan_lead_id);

            $this->leadService->assign($actor, $lead, $request->banker, $remarks);

            $request->fill([
                'status' => AccessRequestStatus::Approved->value,
                'decision_remarks' => $remarks,
                'decided_by' => $actor->id,
                'decided_at' => now(),
            ])->save();

            $this->notifications->notify(
                $request->banker_id,
                'lead.access_approved',
                'Access request approved',
                sprintf('Your access request for lead %s was approved.', $lead->reference),
                ['lead_id' => $lead->id, 'access_request_id' => $request->id],
            );

            return $request->refresh();
        });
    }

    public function reject(User $actor, LeadAccessRequest $request, string $remarks): LeadAccessRequest
    {
        $this->guardPending($request);

        return $this->transaction(function () use ($actor, $request, $remarks): LeadAccessRequest {
            $request->fill([
                'status' => AccessRequestStatus::Rejected->value,
                'decision_remarks' => $remarks,
                'decided_by' => $actor->id,
                'decided_at' => now(),
            ])->save();

            $lead = $request->loanLead;

            $this->notifications->notify(
                $request->banker_id,
                'lead.access_rejected',
                'Access request rejected',
                sprintf('Your access request for lead %s was rejected: %s', $lead?->reference, $remarks),
                ['lead_id' => $request->loan_lead_id, 'access_request_id' => $request->id],
            );

            return $request->refresh();
        });
    }

    /**
     * Requests for leads the acting Manager/RM/Super Admin can see, plus a
     * banker's own requests when they are the actor — one status at a time.
     * Defaults to Pending, the original (and only) behaviour of this method
     * before `$status` existed.
     */
    public function listFor(User $actor, string $status = AccessRequestStatus::Pending->value, int $perPage = 15): LengthAwarePaginator
    {
        $visibleLeadIds = $this->leads->visibleQuery($actor)->pluck('id');

        return LeadAccessRequest::query()
            ->with([
                'loanLead.connector:id,name',
                'loanLead.creator:id,name',
                'banker:id,name,email,role,phone',
                'banker.bankerProfile',
                'decidedBy:id,name,role',
            ])
            ->where('status', $status)
            ->where(function ($q) use ($actor, $visibleLeadIds): void {
                $q->whereIn('loan_lead_id', $visibleLeadIds)
                    ->orWhere('banker_id', $actor->id);
            })
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * All access requests for a lead. The caller must already have `view`
     * authorisation on the lead — nothing further is filtered here.
     *
     * @return Collection<int, LeadAccessRequest>
     */
    public function forLead(LoanLead $lead)
    {
        return LeadAccessRequest::query()
            ->with(['banker:id,name,email,role,phone', 'banker.bankerProfile', 'decidedBy:id,name,role'])
            ->where('loan_lead_id', $lead->id)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Whether the banker has been granted full access (contact details,
     * documents, status changes, update rights) to this lead. See
     * {@see LeadAccessRequest::grantsFullAccess()} for the underlying rule.
     */
    public function hasFullAccess(User $banker, LoanLead $lead): bool
    {
        return LeadAccessRequest::grantsFullAccess($lead->id, $banker->id);
    }

    /**
     * The best match score (0-100) among the banker's own bank_criteria for
     * this lead, or null if none. Used by the Matched Leads listing.
     */
    public function matchScoreFor(User $banker, LoanLead $lead): ?int
    {
        $score = LeadMatch::query()
            ->where('loan_lead_id', $lead->id)
            ->whereHas('bankCriteria', fn ($q) => $q->where('banker_id', $banker->id))
            ->max('match_score');

        return $score !== null ? (int) $score : null;
    }

    private function guardPending(LeadAccessRequest $request): void
    {
        if ($request->statusEnum() !== AccessRequestStatus::Pending) {
            throw new DomainException('This access request has already been decided.', 422);
        }
    }
}
