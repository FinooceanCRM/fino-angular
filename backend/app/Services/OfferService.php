<?php

namespace App\Services;

use App\Enums\Department;
use App\Enums\InquirySource;
use App\Enums\InquiryStatus;
use App\Enums\LeadStatus;
use App\Enums\LoanType;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\InquiryActivity;
use App\Models\LeadOffer;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\OfferEvent;
use App\Models\OfferSetting;
use App\Models\User;
use App\Services\Contracts\CaptchaVerifierInterface;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Offer-based lead generation for guest visitors.
 *
 * A lead is an ordinary row in the existing `loan_leads` table (source `offer_popup` / `offer_landing`), so it
 * lands in the telecaller "Customer Inquiries" queue with calling, claiming, status, notes and follow-ups already
 * built. This service only adds the offer catalogue, popup rules, funnel counters and the public lead intake.
 */
class OfferService extends BaseService
{
    private const DISK = 'local';
    public const DUPLICATE_WINDOW_DAYS = 30;
    /** A visitor is counted once per offer per window, so reloads can't inflate the funnel. */
    private const DEDUPE_MINUTES = ['impression' => 30, 'landing_visit' => 30, 'click' => 1];

    public function __construct(
        private readonly NotificationService $notifications,
        private readonly CaptchaVerifierInterface $captcha,
    ) {
    }

    // ── public: popup + landing ───────────────────────────────────────────────

    /** @return array<string, mixed> */
    public function popupConfig(?string $visitorId = null): array
    {
        $s = OfferSetting::current();
        // The offer popups follow the main switch; the small details form has its own and works without any offer.
        $offer = $s->popup_enabled ? $this->popupOffer() : null;

        // Someone who already submitted the form (even if they cleared their browser's memory) is never shown it again.
        if ($visitorId !== null && OfferEvent::query()->where('visitor_id', $visitorId)->whereIn('type', ['lead', 'duplicate'])->exists()) {
            return ['enabled' => false];
        }

        $callback = $s->callback_enabled && ! ($visitorId !== null && OfferEvent::query()->where('visitor_id', $visitorId)->where('type', 'callback')->exists());

        if ($offer === null && ! $callback) {
            return ['enabled' => false];
        }

        return [
            'enabled' => true,
            'callback_enabled' => $callback,
            'first_delay_seconds' => $this->within($s->first_delay_seconds, OfferSetting::FIRST_RANGE),
            'second_delay_seconds' => $this->within($s->second_delay_seconds, OfferSetting::SECOND_RANGE),
            'repeat_gap_seconds' => $this->within($s->repeat_gap_seconds, OfferSetting::REPEAT_RANGE),
            'pages' => array_values((array) $s->pages),
            'offer' => $offer !== null ? $this->presentPublic($offer) : null,
        ];
    }

    private function popupOffer(): ?LeadOffer
    {
        return LeadOffer::query()->where('is_active', true)->where('show_popup', true)
            ->orderBy('sort_order')->orderByDesc('id')->get()->first(fn (LeadOffer $o): bool => $o->isLive());
    }

    /** A live offer by slug, or null (inactive, expired, unknown). */
    public function liveOffer(string $slug): ?LeadOffer
    {
        $offer = LeadOffer::query()->where('slug', $slug)->first();

        return $offer !== null && $offer->isLive() ? $offer : null;
    }

    /** @return array<string, mixed> */
    public function presentPublic(LeadOffer $o): array
    {
        return [
            'id' => $o->id,
            'slug' => $o->slug,
            'name' => $o->name,
            'type' => $o->type,
            'type_label' => LeadOffer::TYPES[$o->type] ?? 'Offer',
            'badge_text' => $o->badge_text,
            'headline' => $o->headline,
            'description' => $o->description,
            'benefits' => array_values((array) $o->benefits),
            'cta_text' => $o->cta_text,
            'image_url' => $o->image_path !== null ? "public/offers/{$o->slug}/image?v=".($o->updated_at?->timestamp ?? 0) : null,
            'valid_until' => $o->valid_until?->toIso8601String(),
        ];
    }

    public function image(LeadOffer $offer): StreamedResponse
    {
        if ($offer->image_path === null || ! Storage::disk(self::DISK)->exists($offer->image_path)) {
            throw new DomainException('No image.', 404);
        }

        return Storage::disk(self::DISK)->response($offer->image_path, null, ['Cache-Control' => 'public, max-age=86400']);
    }

    // ── public: funnel events ─────────────────────────────────────────────────

    /** Records an anonymous funnel step. Unknown / inactive offers and over-frequent repeats are ignored. */
    public function track(string $type, int $offerId, ?string $visitorId, ?string $page): bool
    {
        if (! in_array($type, OfferEvent::PUBLIC_TYPES, true)) {
            return false;
        }
        $offer = LeadOffer::query()->find($offerId);
        if ($offer === null || ! $offer->isLive()) {
            return false;
        }

        if ($visitorId !== null) {
            $recent = OfferEvent::query()->where('offer_id', $offerId)->where('visitor_id', $visitorId)->where('type', $type)
                ->where('created_at', '>=', now()->subMinutes(self::DEDUPE_MINUTES[$type]))->exists();
            if ($recent) {
                return false;
            }
        }

        $this->event($type, $offerId, $visitorId, $page);

        return true;
    }

    private function event(string $type, ?int $offerId, ?string $visitorId, ?string $page): void
    {
        OfferEvent::query()->create([
            'offer_id' => $offerId, 'visitor_id' => $visitorId, 'type' => $type,
            'page' => $page !== null ? Str::limit($page, 190, '') : null, 'created_at' => now(),
        ]);
    }

    // ── public: the lead ──────────────────────────────────────────────────────

    /**
     * @param array<string, mixed> $data validated payload
     * @return array{lead: LoanLead, duplicate: bool}|null null when the honeypot / timing check caught a bot
     */
    public function submitLead(LeadOffer $offer, array $data, ?User $user = null, ?string $ip = null): ?array
    {
        // Bots: a filled honeypot or an impossibly fast submit get the same answer as a real one, but nothing is saved.
        if (! empty($data['website'])) {
            return null;
        }
        if (isset($data['elapsed_ms']) && (int) $data['elapsed_ms'] < 1500) {
            return null;
        }

        $registered = $user !== null && $user->roleEnum() === UserRole::Customer;
        if (! $registered && filled(config('services.captcha.secret')) && ! $this->captcha->verify((string) ($data['captcha_token'] ?? ''), $ip)) {
            throw new DomainException('We could not verify your submission. Please try again.', 422);
        }

        $phone = $this->normalisePhone((string) $data['phone']);
        $entry = ($data['entry'] ?? 'landing') === 'popup' ? 'popup' : 'landing';
        $visitorId = $data['visitor_id'] ?? null;

        return $this->transaction(function () use ($offer, $data, $user, $registered, $phone, $entry, $visitorId): array {
            // The same person asking again is not a new lead: it is noted on the open one and the telecaller is told.
            $open = LoanLead::query()
                ->whereIn('source', InquirySource::inquiryValues())
                ->where('applicant_phone', $phone)
                ->whereNotIn('status', [LeadStatus::Closed->value, LeadStatus::Rejected->value])
                ->where('created_at', '>=', now()->subDays(self::DUPLICATE_WINDOW_DAYS))
                ->lockForUpdate()->latest('id')->first();

            if ($open !== null) {
                $this->recordRepeat($open, $offer);
                $this->event('duplicate', $offer->id, $visitorId, null);

                return ['lead' => $open, 'duplicate' => true];
            }

            [$loanType, $serviceName] = $this->resolveService($data['interested_service'] ?? null);
            $customer = $registered ? Customer::query()->where('user_id', $user->id)->first() : null;
            $source = $entry === 'popup' ? InquirySource::OfferPopup : InquirySource::OfferLanding;

            $lead = LoanLead::query()->create([
                'reference' => 'OFR-'.now()->format('ymd').'-'.Str::upper(Str::random(5)),
                'applicant_name' => trim((string) $data['name']),
                'applicant_email' => strtolower(trim((string) $data['email'])),
                'applicant_phone' => $phone,
                'loan_type' => $loanType->value,
                'department' => Department::fromLoanType($loanType)->value,
                // An offer enquiry carries no loan request. 0 means "none given" and is shown as "—" to staff.
                'loan_amount' => 0,
                'city' => trim((string) $data['city']),
                'status' => LeadStatus::New->value,
                'source' => $source->value,
                'customer_id' => $customer?->id,
                'offer_id' => $offer->id,
                'visitor_id' => $visitorId,
                'inquiry_status' => InquiryStatus::New->value,
                'details' => [
                    'product_name' => $offer->name,
                    'offer' => [
                        'id' => $offer->id,
                        'name' => $offer->name,
                        'type' => $offer->type,
                        'entry' => $entry,
                        'interested_service' => $serviceName,
                        'message' => filled($data['message'] ?? null) ? trim((string) $data['message']) : null,
                        'account_status' => $registered ? 'registered' : 'guest',
                        'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
                        'privacy_consent_at' => now()->toIso8601String(),
                    ],
                ],
            ]);

            if ($customer !== null) {
                $customer->leads()->syncWithoutDetaching([$lead->id]);
            }

            LeadStatusHistory::query()->create([
                'loan_lead_id' => $lead->id, 'from_status' => null, 'to_status' => LeadStatus::New->value,
                'changed_by' => $registered ? $user->id : null,
                'remarks' => sprintf('Offer lead via %s (%s).', $source->label(), $offer->name),
            ]);

            InquiryActivity::query()->create([
                'loan_lead_id' => $lead->id, 'user_id' => null, 'type' => 'created',
                'body' => sprintf('%s claimed the offer “%s” (%s).', $lead->applicant_name, $offer->name, $source->label()),
                'meta' => ['offer_id' => $offer->id, 'entry' => $entry],
            ]);

            $this->notifications->notifyMany(
                $this->queueStaffIds(),
                'inquiry.new',
                'New offer lead',
                sprintf('%s claimed “%s” from %s (%s). Please call them.', $lead->applicant_name, $offer->name, $lead->city, $lead->reference),
                ['lead_id' => $lead->id, 'offer_id' => $offer->id],
            );

            $this->event('lead', $offer->id, $visitorId, null);

            return ['lead' => $lead, 'duplicate' => false];
        });
    }

    /**
     * The small "share your details" popup: no offer, just name + mobile + city. It becomes a normal lead in the Customer Inquiries queue.
     *
     * @param array<string, mixed> $data validated payload
     * @return array{lead: LoanLead, duplicate: bool}|null null when the honeypot / timing check caught a bot
     */
    public function submitCallback(array $data, ?User $user = null, ?string $ip = null): ?array
    {
        if (! empty($data['website'])) {
            return null;
        }
        if (isset($data['elapsed_ms']) && (int) $data['elapsed_ms'] < 1200) {
            return null;
        }

        $registered = $user !== null && $user->roleEnum() === UserRole::Customer;
        if (! $registered && filled(config('services.captcha.secret')) && ! $this->captcha->verify((string) ($data['captcha_token'] ?? ''), $ip)) {
            throw new DomainException('We could not verify your submission. Please try again.', 422);
        }

        $phone = $this->normalisePhone((string) $data['phone']);
        $visitorId = $data['visitor_id'] ?? null;

        return $this->transaction(function () use ($data, $user, $registered, $phone, $visitorId): array {
            $open = LoanLead::query()
                ->whereIn('source', InquirySource::inquiryValues())
                ->where('applicant_phone', $phone)
                ->whereNotIn('status', [LeadStatus::Closed->value, LeadStatus::Rejected->value])
                ->where('created_at', '>=', now()->subDays(self::DUPLICATE_WINDOW_DAYS))
                ->lockForUpdate()->latest('id')->first();

            if ($open !== null) {
                $this->recordRepeat($open, null);
                $this->event('callback', null, $visitorId, null);

                return ['lead' => $open, 'duplicate' => true];
            }

            $customer = $registered ? Customer::query()->where('user_id', $user->id)->first() : null;
            $lead = LoanLead::query()->create([
                'reference' => 'CBK-'.now()->format('ymd').'-'.Str::upper(Str::random(5)),
                'applicant_name' => trim((string) $data['name']),
                'applicant_email' => null,
                'applicant_phone' => $phone,
                'loan_type' => LoanType::Personal->value,
                'department' => Department::fromLoanType(LoanType::Personal)->value,
                'loan_amount' => 0,
                'city' => trim((string) $data['city']),
                'status' => LeadStatus::New->value,
                'source' => InquirySource::CallbackPopup->value,
                'customer_id' => $customer?->id,
                'visitor_id' => $visitorId,
                'inquiry_status' => InquiryStatus::New->value,
                'details' => [
                    'product_name' => 'Website details',
                    'callback' => ['account_status' => $registered ? 'registered' : 'guest', 'privacy_consent_at' => now()->toIso8601String()],
                ],
            ]);

            if ($customer !== null) {
                $customer->leads()->syncWithoutDetaching([$lead->id]);
            }

            LeadStatusHistory::query()->create([
                'loan_lead_id' => $lead->id, 'from_status' => null, 'to_status' => LeadStatus::New->value,
                'changed_by' => $registered ? $user->id : null, 'remarks' => 'Details shared via the website popup.',
            ]);

            InquiryActivity::query()->create([
                'loan_lead_id' => $lead->id, 'user_id' => null, 'type' => 'created',
                'body' => sprintf('%s shared their details in the website popup.', $lead->applicant_name),
                'meta' => ['callback' => true],
            ]);

            $this->notifications->notifyMany(
                $this->queueStaffIds(),
                'inquiry.new',
                'New website details',
                sprintf('%s from %s shared their details in the website popup (%s).', $lead->applicant_name, $lead->city, $lead->reference),
                ['lead_id' => $lead->id],
            );

            $this->event('callback', null, $visitorId, null);

            return ['lead' => $lead, 'duplicate' => false];
        });
    }

    private function recordRepeat(LoanLead $lead, ?LeadOffer $offer): void
    {
        $what = $offer !== null ? sprintf('claimed the offer “%s”', $offer->name) : 'shared their details';
        $lead->increment('resubmission_count');

        InquiryActivity::query()->create([
            'loan_lead_id' => $lead->id, 'user_id' => null, 'type' => 'resubmission',
            'body' => sprintf('The same number %s again.', $what),
            'meta' => ['count' => $lead->resubmission_count, 'offer_id' => $offer?->id],
        ]);

        $this->notifications->notifyMany(
            array_filter([$lead->assigned_telecaller_id]) ?: $this->queueStaffIds(),
            'inquiry.resubmitted',
            'Customer asked again',
            sprintf('%s %s again (%s).', $lead->applicant_name, $what, $lead->reference),
            ['lead_id' => $lead->id],
        );
    }

    /** @return array{0: LoanType, 1: string|null} */
    private function resolveService(?string $slug): array
    {
        if (blank($slug)) {
            return [LoanType::Personal, null];
        }
        $product = collect(config('loan_products.products'))->firstWhere('slug', $slug);
        if ($product === null) {
            return [LoanType::Personal, null];
        }

        return [LoanType::from($product['loan_type']), (string) $product['name']];
    }

    private function normalisePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        return strlen($digits) > 10 ? substr($digits, -10) : $digits;
    }

    /** @return array<int, int> */
    private function queueStaffIds(): array
    {
        return User::query()->whereIn('role', [UserRole::Telecaller->value, UserRole::SuperAdmin->value])
            ->where('is_active', true)->pluck('id')->all();
    }

    // ── admin: offers ─────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    public function listOffers(): array
    {
        $events = OfferEvent::query()->selectRaw('offer_id, type, count(*) as c')->groupBy('offer_id', 'type')->get()
            ->groupBy('offer_id')->map(fn (Collection $g) => $g->pluck('c', 'type'));
        $leads = LoanLead::query()->whereNotNull('offer_id')->selectRaw('offer_id, count(*) as c')->groupBy('offer_id')->pluck('c', 'offer_id');

        return LeadOffer::query()->orderBy('sort_order')->orderByDesc('id')->get()->map(function (LeadOffer $o) use ($events, $leads): array {
            $e = $events->get($o->id, collect());

            return $this->presentAdmin($o) + [
                'impressions' => (int) ($e['impression'] ?? 0),
                'clicks' => (int) ($e['click'] ?? 0),
                'visits' => (int) ($e['landing_visit'] ?? 0),
                'leads' => (int) ($leads[$o->id] ?? 0),
            ];
        })->all();
    }

    /** @return array<string, mixed> */
    public function presentAdmin(LeadOffer $o): array
    {
        return $this->presentPublic($o) + [
            'is_active' => $o->is_active,
            'show_popup' => $o->show_popup,
            'is_live' => $o->isLive(),
            'valid_from' => $o->valid_from?->toIso8601String(),
            'sort_order' => $o->sort_order,
            'created_at' => $o->created_at?->toIso8601String(),
        ];
    }

    /** @param array<string, mixed> $data */
    public function createOffer(User $actor, array $data): LeadOffer
    {
        $offer = LeadOffer::query()->create($this->offerFields($data) + [
            'slug' => $this->uniqueSlug((string) $data['name']),
            'created_by' => $actor->id,
        ]);

        return $offer;
    }

    /** @param array<string, mixed> $data */
    public function updateOffer(LeadOffer $offer, array $data): LeadOffer
    {
        $offer->update($this->offerFields($data));

        return $offer->refresh();
    }

    /**
     * @param array<string, mixed> $d
     * @return array<string, mixed>
     */
    private function offerFields(array $d): array
    {
        $out = array_intersect_key($d, array_flip(['name', 'type', 'badge_text', 'headline', 'description', 'cta_text', 'is_active', 'show_popup', 'sort_order']));
        if (array_key_exists('benefits', $d)) {
            $out['benefits'] = collect((array) $d['benefits'])->map(fn ($b) => trim(strip_tags((string) $b)))->filter()->take(6)->values()->all();
        }
        // A plain date means the whole day: valid from its start, until its end.
        foreach (['valid_from' => 'startOfDay', 'valid_until' => 'endOfDay'] as $k => $edge) {
            if (array_key_exists($k, $d)) {
                $out[$k] = $d[$k] ? $this->boundary((string) $d[$k], $edge) : null;
            }
        }
        foreach (['name', 'headline', 'description', 'badge_text', 'cta_text'] as $k) {
            if (isset($out[$k]) && is_string($out[$k])) {
                $out[$k] = trim(strip_tags($out[$k]));
            }
        }

        return $out;
    }

    private function boundary(string $value, string $edge): CarbonImmutable
    {
        $t = CarbonImmutable::parse($value);

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1 ? $t->{$edge}() : $t;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'offer';
        $slug = $base;
        $n = 2;
        while (LeadOffer::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }

    public function setImage(LeadOffer $offer, UploadedFile $file): LeadOffer
    {
        $path = $file->store('offer-images/'.$offer->id, self::DISK);
        if ($path === false) {
            throw new DomainException('The image could not be stored.', 500);
        }
        if ($offer->image_path !== null) {
            Storage::disk(self::DISK)->delete($offer->image_path);
        }
        $offer->update(['image_path' => $path]);

        return $offer->refresh();
    }

    public function removeImage(LeadOffer $offer): LeadOffer
    {
        if ($offer->image_path !== null) {
            Storage::disk(self::DISK)->delete($offer->image_path);
            $offer->update(['image_path' => null]);
        }

        return $offer->refresh();
    }

    /** Offers with leads are only deactivated by the UI; this removes the offer page, never the leads. */
    public function deleteOffer(LeadOffer $offer): void
    {
        $offer->update(['is_active' => false]);
        $offer->delete();
    }

    // ── admin: popup settings ─────────────────────────────────────────────────

    /** @return array<string, mixed> */
    public function settings(): array
    {
        $s = OfferSetting::current();

        return [
            'popup_enabled' => $s->popup_enabled,
            'callback_enabled' => $s->callback_enabled,
            'first_delay_seconds' => $this->within($s->first_delay_seconds, OfferSetting::FIRST_RANGE),
            'second_delay_seconds' => $this->within($s->second_delay_seconds, OfferSetting::SECOND_RANGE),
            'repeat_gap_seconds' => $this->within($s->repeat_gap_seconds, OfferSetting::REPEAT_RANGE),
            'pages' => array_values((array) $s->pages),
            'ranges' => ['first' => OfferSetting::FIRST_RANGE, 'second' => OfferSetting::SECOND_RANGE, 'repeat' => OfferSetting::REPEAT_RANGE],
        ];
    }

    /** @param array<string, mixed> $data */
    public function updateSettings(User $actor, array $data): array
    {
        $s = OfferSetting::current();
        $s->update([
            'popup_enabled' => (bool) ($data['popup_enabled'] ?? $s->popup_enabled),
            'callback_enabled' => (bool) ($data['callback_enabled'] ?? $s->callback_enabled),
            'first_delay_seconds' => $this->within((int) ($data['first_delay_seconds'] ?? $s->first_delay_seconds), OfferSetting::FIRST_RANGE),
            'second_delay_seconds' => $this->within((int) ($data['second_delay_seconds'] ?? $s->second_delay_seconds), OfferSetting::SECOND_RANGE),
            'repeat_gap_seconds' => $this->within((int) ($data['repeat_gap_seconds'] ?? $s->repeat_gap_seconds), OfferSetting::REPEAT_RANGE),
            'pages' => array_key_exists('pages', $data) ? array_values(array_unique(array_map('strval', (array) $data['pages']))) : $s->pages,
            'updated_by' => $actor->id,
        ]);

        return $this->settings();
    }

    /** @param array{0: int, 1: int} $range */
    private function within(int $seconds, array $range): int
    {
        return max($range[0], min($range[1], $seconds));
    }

    // ── admin: analytics ──────────────────────────────────────────────────────

    /** @return array<string, mixed> */
    public function analytics(CarbonImmutable $from, CarbonImmutable $to, ?int $offerId = null): array
    {
        $events = OfferEvent::query()->whereBetween('created_at', [$from, $to])->when($offerId, fn ($q) => $q->where('offer_id', $offerId))
            ->selectRaw('offer_id, type, count(*) as c, count(distinct visitor_id) as u')->groupBy('offer_id', 'type')->get();
        $totals = fn (string $type, string $col = 'c'): int => (int) $events->where('type', $type)->sum($col);

        $leadQuery = fn () => LoanLead::query()->whereNotNull('offer_id')->whereBetween('created_at', [$from, $to])->when($offerId, fn ($q) => $q->where('offer_id', $offerId));
        $leads = $leadQuery()->count();
        $impressions = $totals('impression');
        $clicks = $totals('click');
        $visits = $totals('landing_visit');
        $pct = static fn (int $num, int $den): ?float => $den > 0 ? round($num / $den * 100, 1) : null;

        $perOffer = LeadOffer::withTrashed()->get()->map(function (LeadOffer $o) use ($events, $leadQuery): array {
            $e = $events->where('offer_id', $o->id);
            $count = fn (string $t): int => (int) $e->where('type', $t)->sum('c');
            $leads = (clone $leadQuery())->where('offer_id', $o->id)->count();
            $visits = $count('landing_visit');

            return [
                'id' => $o->id, 'name' => $o->name, 'is_active' => $o->is_active && $o->deleted_at === null,
                'impressions' => $count('impression'), 'clicks' => $count('click'), 'visits' => $visits, 'leads' => $leads,
                'conversion_percent' => $visits > 0 ? round($leads / $visits * 100, 1) : null,
            ];
        })->filter(fn (array $r): bool => $r['impressions'] + $r['clicks'] + $r['visits'] + $r['leads'] > 0)
            ->sortByDesc(fn (array $r): array => [$r['leads'], $r['conversion_percent'] ?? 0])->values()->all();

        $bySource = $leadQuery()->selectRaw('source, count(*) as c')->groupBy('source')->pluck('c', 'source');
        $byStatus = $leadQuery()->selectRaw('inquiry_status, count(*) as c')->groupBy('inquiry_status')->pluck('c', 'inquiry_status');
        $byDay = $leadQuery()->selectRaw('date(created_at) as d, count(*) as c')->groupBy('d')->orderBy('d')->pluck('c', 'd');

        return [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'totals' => [
                'impressions' => $impressions,
                'unique_visitors_shown' => $totals('impression', 'u'),
                'clicks' => $clicks,
                'landing_visits' => $visits,
                'leads' => $leads,
                'duplicates' => $totals('duplicate'),
                'callback_requests' => $offerId === null ? $totals('callback') : 0,
                'click_through_percent' => $pct($clicks, $impressions),
                'conversion_percent' => $pct($leads, $visits),
                'overall_percent' => $pct($leads, $impressions),
            ],
            'best_offers' => $perOffer,
            'sources' => collect(InquirySource::cases())->filter(fn (InquirySource $s): bool => in_array($s, [InquirySource::OfferPopup, InquirySource::OfferLanding], true))
                ->map(fn (InquirySource $s): array => ['value' => $s->value, 'label' => $s->label(), 'count' => (int) ($bySource[$s->value] ?? 0)])->values()->all(),
            'statuses' => collect(InquiryStatus::cases())->map(fn (InquiryStatus $s): array => ['value' => $s->value, 'label' => $s->label(), 'count' => (int) ($byStatus[$s->value] ?? 0)])->values()->all(),
            'leads_by_day' => $byDay->map(fn ($c, $d): array => ['date' => $d, 'count' => (int) $c])->values()->all(),
        ];
    }
}
