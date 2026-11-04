<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\UserRole;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Public\SubmitInquiryRequest;
use App\Services\InquiryIntakeService;
use Illuminate\Http\JsonResponse;

class PublicInquiryController extends BaseApiController
{
    public function __construct(private readonly InquiryIntakeService $intake)
    {
    }

    /**
     * Honeypot hits get the same 201 as a real submission (see
     * PublicLeadIntakeService). A duplicate also looks identical to the
     * caller: it never reveals whether another inquiry already existed.
     */
    public function store(SubmitInquiryRequest $request): JsonResponse
    {
        // Optional sign-in: a customer's bearer token links the inquiry to
        // their own account; anyone else submits anonymously.
        $user = $request->user('sanctum');
        if ($user !== null && $user->roleEnum() !== UserRole::Customer) {
            $user = null; // a staff token never makes an inquiry "authenticated"
        }

        // Applying needs an account (see config/website.php), so every
        // application lands on the customer's own dashboard.
        if ($user === null && ! config('website.anonymous_inquiries')) {
            return $this->respondError('Please create a free account or log in to apply for a loan.', 403);
        }

        $result = $this->intake->submit($request->validated(), $user, $request->ip());

        return $this->respondCreated(
            $result === null ? ['reference' => null] : ['reference' => $result['lead']->reference],
            'Thank you. Your request has been received and an advisor will contact you shortly.',
        );
    }
}
