<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Exceptions\DomainException;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use App\Services\CustomerProfileService as Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Customer "Profile" section (route middleware `role:customer`). Every action works on the caller's own rows.
 */
class CustomerProfileController extends BaseApiController
{
    public function __construct(private readonly Profile $profile)
    {
    }

    private function me(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }

    /** Re-checks the caller's password before something hard to undo. */
    private function confirmPassword(Request $request): void
    {
        $request->validate(['password' => ['required', 'string']]);
        if (! Hash::check((string) $request->input('password'), $this->me($request)->password)) {
            throw new DomainException('That password is not correct.', 422, ['password' => ['That password is not correct.']]);
        }
    }

    // ── personal ──────────────────────────────────────────────────────────────

    public function show(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->present($this->me($request)));
    }

    public function prefill(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->prefill($this->me($request)));
    }

    public function updateDetails(Request $request): JsonResponse
    {
        // Tidy what was typed, but only for the fields that were actually sent (a missing field must not wipe a saved value).
        if (is_string($request->input('pan'))) {
            $request->merge(['pan' => strtoupper(trim($request->input('pan')))]);
        }
        if (is_string($request->input('aadhaar'))) {
            $request->merge(['aadhaar' => preg_replace('/[\s-]+/', '', $request->input('aadhaar'))]);
        }
        $data = $request->validate([
            'dob' => ['nullable', 'date', 'before_or_equal:-18 years', 'after:1900-01-01'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'occupation' => ['nullable', 'string', 'max:100'],
            'language' => ['nullable', Rule::in(['en', 'hi', 'mr'])],
            // Optional: kept so the loan application can be pre-filled.
            'pan' => ['nullable', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/'],
            'aadhaar' => ['nullable', 'digits:12'],
            'employment_type' => ['nullable', Rule::in(['salaried', 'self_employed', 'business', 'professional', 'other'])],
            'company' => ['nullable', 'string', 'max:150'],
            'designation' => ['nullable', 'string', 'max:100'],
            'experience_years' => ['nullable', 'numeric', 'min:0', 'max:60'],
            'monthly_income' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'office_address' => ['nullable', 'string', 'max:255'],
            'work_city' => ['nullable', 'string', 'max:100'],
        ]);
        $this->profile->updateDetails($this->me($request), $data);

        return $this->respondSuccess($this->profile->present($this->me($request)), 'Details saved.');
    }

    public function updateAddresses(Request $request): JsonResponse
    {
        $address = ['nullable', 'array'];
        $data = $request->validate([
            'current_address' => $address,
            'current_address.line1' => ['required_with:current_address', 'string', 'max:200'],
            'current_address.line2' => ['nullable', 'string', 'max:200'],
            'current_address.city' => ['required_with:current_address', 'string', 'max:100'],
            'current_address.state' => ['required_with:current_address', 'string', 'max:100'],
            'current_address.pincode' => ['required_with:current_address', 'digits:6'],
            'permanent_same_as_current' => ['nullable', 'boolean'],
            'permanent_address' => $address,
            'permanent_address.line1' => ['required_with:permanent_address', 'string', 'max:200'],
            'permanent_address.line2' => ['nullable', 'string', 'max:200'],
            'permanent_address.city' => ['required_with:permanent_address', 'string', 'max:100'],
            'permanent_address.state' => ['required_with:permanent_address', 'string', 'max:100'],
            'permanent_address.pincode' => ['required_with:permanent_address', 'digits:6'],
        ]);
        $this->profile->updateAddresses($this->me($request), $data);

        return $this->respondSuccess($this->profile->present($this->me($request)), 'Address saved.');
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'max:2048', 'mimes:jpg,jpeg,png', 'mimetypes:image/jpeg,image/png']]);
        $this->profile->storePhoto($this->me($request), $request->file('file'));

        return $this->respondSuccess(null, 'Photo updated.');
    }

    public function photo(Request $request): StreamedResponse
    {
        return $this->profile->photo($this->me($request));
    }

    public function removePhoto(Request $request): JsonResponse
    {
        $this->profile->removePhoto($this->me($request));

        return $this->respondSuccess(null, 'Photo removed.');
    }

    // ── KYC ───────────────────────────────────────────────────────────────────

    public function kyc(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->kycSummary($this->me($request)));
    }

    public function uploadKyc(Request $request, string $type): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png'],
            'number' => ['nullable', 'string', 'max:20'],
        ]);
        $doc = $this->profile->uploadKyc($this->me($request), $type, $request->file('file'), $request->input('number'));

        return $this->respondCreated(['id' => $doc->id, 'status' => $doc->status, 'kyc' => $this->profile->kycSummary($this->me($request))], 'Document uploaded.');
    }

    public function downloadKyc(Request $request, int $document): StreamedResponse
    {
        return $this->profile->kycDownload($this->me($request), $document);
    }

    // ── bank & UPI ────────────────────────────────────────────────────────────

    public function banks(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->bankAccounts($this->me($request)));
    }

    public function addBank(Request $request): JsonResponse
    {
        $request->merge(['ifsc' => strtoupper(trim((string) $request->input('ifsc')))]);
        $data = $request->validate([
            'holder_name' => ['required', 'string', 'min:2', 'max:150'],
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'regex:/^\d{9,18}$/'],
            'account_number_confirmation' => ['required', 'same:account_number'],
            'ifsc' => ['required', 'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/'],
            'account_type' => ['required', Rule::in(['savings', 'current'])],
            'branch' => ['nullable', 'string', 'max:150'],
            'confirm' => ['accepted'],
        ]);
        $this->profile->addBankAccount($this->me($request), $data);

        return $this->respondCreated($this->profile->bankAccounts($this->me($request)), 'Bank account saved.');
    }

    public function primaryBank(Request $request, int $id): JsonResponse
    {
        $this->profile->setPrimaryBank($this->me($request), $id);

        return $this->respondSuccess($this->profile->bankAccounts($this->me($request)), 'Primary account updated.');
    }

    public function deleteBank(Request $request, int $id): JsonResponse
    {
        $this->profile->deleteBank($this->me($request), $id);

        return $this->respondSuccess($this->profile->bankAccounts($this->me($request)), 'Bank account removed.');
    }

    public function upi(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->upiIds($this->me($request)));
    }

    public function addUpi(Request $request): JsonResponse
    {
        $data = $request->validate(['vpa' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9._\-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}$/']]);
        $this->profile->addUpi($this->me($request), $data['vpa']);

        return $this->respondCreated($this->profile->upiIds($this->me($request)), 'UPI ID saved.');
    }

    public function primaryUpi(Request $request, int $id): JsonResponse
    {
        $this->profile->setPrimaryUpi($this->me($request), $id);

        return $this->respondSuccess($this->profile->upiIds($this->me($request)), 'Primary UPI ID updated.');
    }

    public function deleteUpi(Request $request, int $id): JsonResponse
    {
        $this->profile->deleteUpi($this->me($request), $id);

        return $this->respondSuccess($this->profile->upiIds($this->me($request)), 'UPI ID removed.');
    }

    // ── communication ─────────────────────────────────────────────────────────

    public function communication(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->communication($this->me($request)));
    }

    public function updateCommunication(Request $request): JsonResponse
    {
        $rules = ['language' => ['nullable', Rule::in(['en', 'hi', 'mr'])], 'events' => ['nullable', 'array'], 'marketing' => ['nullable', 'array'], 'quiet_hours' => ['nullable', 'array']];
        foreach (Profile::NOTIFICATION_EVENTS as $e) {
            foreach (Profile::CHANNELS as $c) {
                $rules["events.$e.$c"] = ['nullable', 'boolean'];
            }
        }
        foreach (Profile::MARKETING as $m) {
            $rules["marketing.$m"] = ['nullable', 'boolean'];
        }
        $rules['quiet_hours.enabled'] = ['nullable', 'boolean'];
        $rules['quiet_hours.start'] = ['nullable', 'date_format:H:i'];
        $rules['quiet_hours.end'] = ['nullable', 'date_format:H:i'];

        $data = $request->validate($rules);
        // Only the known keys are kept, whatever else the client sent.
        $data['events'] = collect($data['events'] ?? [])->only(Profile::NOTIFICATION_EVENTS)->map(fn ($c) => collect($c)->only(Profile::CHANNELS)->all())->all();
        $data['marketing'] = collect($data['marketing'] ?? [])->only(Profile::MARKETING)->all();

        return $this->respondSuccess($this->profile->updateCommunication($this->me($request), $data), 'Preferences saved.');
    }

    // ── security, data, account ───────────────────────────────────────────────

    public function sessions(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->sessions($this->me($request), $request->user()?->currentAccessToken()?->id));
    }

    public function signOutOthers(Request $request): JsonResponse
    {
        $n = $this->profile->signOutOtherSessions($this->me($request), $request->user()?->currentAccessToken()?->id);

        return $this->respondSuccess(['signed_out' => $n], 'Signed out of other devices.');
    }

    public function export(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->profile->export($this->me($request)));
    }

    public function requestDeletion(Request $request): JsonResponse
    {
        $this->confirmPassword($request);
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:100'],
            'comments' => ['nullable', 'string', 'max:500'],
            'confirm' => ['accepted'],
        ]);
        $p = $this->profile->requestDeletion($this->me($request), $data['reason'], $data['comments'] ?? null);

        return $this->respondSuccess(['deletion_requested_at' => $p->deletion_requested_at?->toIso8601String()], 'Your deletion request has been received.');
    }

    public function cancelDeletion(Request $request): JsonResponse
    {
        $this->profile->cancelDeletion($this->me($request));

        return $this->respondSuccess(null, 'Your deletion request has been cancelled.');
    }

    public function deactivate(Request $request): JsonResponse
    {
        $this->confirmPassword($request);
        $this->profile->deactivate($this->me($request));

        return $this->respondSuccess(null, 'Your account has been deactivated.');
    }
}
