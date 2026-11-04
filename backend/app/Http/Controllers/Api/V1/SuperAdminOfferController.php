<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\LeadOffer;
use App\Models\OfferSetting;
use App\Models\User;
use App\Services\OfferService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Offer management for the super admin (route middleware `role:super_admin`): offers, popup settings, analytics. */
class SuperAdminOfferController extends BaseApiController
{
    public function __construct(private readonly OfferService $offers)
    {
    }

    private function me(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }

    /** @return array<string, mixed> */
    private function rules(bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'min:2', 'max:150'],
            'type' => [$req, Rule::in(array_keys(LeadOffer::TYPES))],
            'badge_text' => ['nullable', 'string', 'max:60'],
            'headline' => [$req, 'string', 'min:3', 'max:200'],
            'description' => [$req, 'string', 'min:10', 'max:2000'],
            'benefits' => ['nullable', 'array', 'max:6'],
            'benefits.*' => ['string', 'max:160'],
            'cta_text' => ['nullable', 'string', 'max:60'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['sometimes', 'boolean'],
            'show_popup' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
        ];
    }

    public function meta(): JsonResponse
    {
        return $this->respondSuccess([
            'types' => collect(LeadOffer::TYPES)->map(fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values(),
            'services' => collect(config('loan_products.products'))->map(fn (array $p): array => ['slug' => $p['slug'], 'name' => $p['name']])->values(),
        ]);
    }

    public function index(): JsonResponse
    {
        return $this->respondSuccess($this->offers->listOffers());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(true));
        $offer = $this->offers->createOffer($this->me($request), $data + ['cta_text' => $data['cta_text'] ?? 'Claim My Offer']);

        return $this->respondCreated($this->offers->presentAdmin($offer), 'Offer created.');
    }

    public function show(int $offer): JsonResponse
    {
        return $this->respondSuccess($this->offers->presentAdmin(LeadOffer::query()->findOrFail($offer)));
    }

    public function update(Request $request, int $offer): JsonResponse
    {
        $model = LeadOffer::query()->findOrFail($offer);
        $data = $request->validate($this->rules(false));
        if (isset($data['valid_until']) && ! isset($data['valid_from']) && $model->valid_from !== null && CarbonImmutable::parse($data['valid_until'])->endOfDay()->lt($model->valid_from)) {
            return $this->respondError('The end date must be after the start date.', 422);
        }

        return $this->respondSuccess($this->offers->presentAdmin($this->offers->updateOffer($model, $data)), 'Offer saved.');
    }

    public function destroy(int $offer): JsonResponse
    {
        $this->offers->deleteOffer(LeadOffer::query()->findOrFail($offer));

        return $this->respondSuccess(null, 'Offer removed. Leads it generated are kept.');
    }

    public function uploadImage(Request $request, int $offer): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'max:2048', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp']]);
        $model = $this->offers->setImage(LeadOffer::query()->findOrFail($offer), $request->file('file'));

        return $this->respondSuccess($this->offers->presentAdmin($model), 'Image saved.');
    }

    public function removeImage(int $offer): JsonResponse
    {
        return $this->respondSuccess($this->offers->presentAdmin($this->offers->removeImage(LeadOffer::query()->findOrFail($offer))), 'Image removed.');
    }

    public function settings(): JsonResponse
    {
        return $this->respondSuccess($this->offers->settings());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'popup_enabled' => ['sometimes', 'boolean'],
            'callback_enabled' => ['sometimes', 'boolean'],
            'first_delay_seconds' => ['sometimes', 'integer', 'between:'.implode(',', OfferSetting::FIRST_RANGE)],
            'second_delay_seconds' => ['sometimes', 'integer', 'between:'.implode(',', OfferSetting::SECOND_RANGE)],
            'repeat_gap_seconds' => ['sometimes', 'integer', 'between:'.implode(',', OfferSetting::REPEAT_RANGE)],
            'pages' => ['sometimes', 'array', 'max:40'],
            'pages.*' => ['string', 'max:120', 'regex:/^(\*|\/[A-Za-z0-9\-_\/\*]*)$/'],
        ]);

        return $this->respondSuccess($this->offers->updateSettings($this->me($request), $data), 'Popup settings saved.');
    }

    public function analytics(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'offer_id' => ['nullable', 'integer', 'min:1'],
        ]);
        $to = isset($data['to']) ? CarbonImmutable::parse($data['to'])->endOfDay() : CarbonImmutable::now()->endOfDay();
        $from = isset($data['from']) ? CarbonImmutable::parse($data['from'])->startOfDay() : $to->subDays(29)->startOfDay();

        return $this->respondSuccess($this->offers->analytics($from, $to, isset($data['offer_id']) ? (int) $data['offer_id'] : null));
    }
}
