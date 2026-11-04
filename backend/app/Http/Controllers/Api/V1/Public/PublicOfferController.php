<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\UserRole;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Public\CallbackRequest;
use App\Http\Requests\Public\OfferLeadRequest;
use App\Models\LeadOffer;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Public, unauthenticated surface of the offer system: popup configuration, landing-page content, anonymous funnel
 * events and the lead form. The offer image is served here too (it is promotional material, not private data).
 */
class PublicOfferController extends BaseApiController
{
    public function __construct(private readonly OfferService $offers)
    {
    }

    public function popup(Request $request): JsonResponse
    {
        $visitor = $request->query('visitor_id');

        return $this->respondSuccess($this->offers->popupConfig(is_string($visitor) && preg_match('/^[0-9a-fA-F-]{16,64}$/', $visitor) === 1 ? $visitor : null));
    }

    public function show(string $slug): JsonResponse
    {
        $offer = $this->offers->liveOffer($slug);

        return $offer === null
            ? $this->respondError('This offer is no longer available.', 404)
            : $this->respondSuccess($this->offers->presentPublic($offer));
    }

    public function event(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:impression,click,landing_visit'],
            'offer_id' => ['required', 'integer', 'min:1'],
            'visitor_id' => ['nullable', 'string', 'regex:/^[0-9a-fA-F\-]{16,64}$/'],
            'page' => ['nullable', 'string', 'max:190'],
        ]);

        return $this->respondSuccess(['recorded' => $this->offers->track($data['type'], (int) $data['offer_id'], $data['visitor_id'] ?? null, $data['page'] ?? null)]);
    }

    /**
     * The answer is the same whether the lead is new, a repeat of someone already in the queue, or a bot: the form
     * never reveals whether a number was already known.
     */
    public function lead(OfferLeadRequest $request, string $slug): JsonResponse
    {
        $offer = $this->offers->liveOffer($slug);
        if ($offer === null) {
            return $this->respondError('This offer is no longer available.', 404);
        }

        // A customer's own sign-in links the lead to their account; a staff token never counts.
        $user = $request->user('sanctum');
        if ($user !== null && $user->roleEnum() !== UserRole::Customer) {
            $user = null;
        }

        $result = $this->offers->submitLead($offer, $request->validated(), $user, $request->ip());

        return $this->respondCreated(
            ['reference' => $result !== null && ! $result['duplicate'] ? $result['lead']->reference : null],
            'Thank you! Your request has been received and our team will call you soon.',
        );
    }

    /** The small "share your details" popup. Same answer for a new request, a repeat and a bot. */
    public function callback(CallbackRequest $request): JsonResponse
    {
        $user = $request->user('sanctum');
        if ($user !== null && $user->roleEnum() !== UserRole::Customer) {
            $user = null;
        }

        $this->offers->submitCallback($request->validated(), $user, $request->ip());

        return $this->respondCreated(null, 'Thank you! We have your details.');
    }

    public function image(string $slug): StreamedResponse
    {
        $offer = LeadOffer::query()->where('slug', $slug)->firstOrFail();

        return $this->offers->image($offer);
    }
}
