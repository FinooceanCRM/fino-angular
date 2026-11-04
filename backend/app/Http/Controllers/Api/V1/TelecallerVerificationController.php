<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\TelecallerVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Telecaller verification desk: the documents, KYC files, bank accounts and website messages that customers
 * have submitted and a person still has to check. See {@see TelecallerVerificationService}.
 */
class TelecallerVerificationController extends BaseApiController
{
    public function __construct(private readonly TelecallerVerificationService $desk)
    {
    }

    public function summary(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->desk->summary($request->user()));
    }

    // ── application documents ─────────────────────────────────────────────────

    public function documents(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->desk->documents($request->user()));
    }

    public function downloadDocument(Request $request, int $id): StreamedResponse
    {
        return $this->desk->streamDocument($request->user(), $id);
    }

    public function verifyDocument(Request $request, int $id): JsonResponse
    {
        $this->desk->verifyDocument($request->user(), $id);

        return $this->respondSuccess(null, 'Document verified.');
    }

    public function rejectDocument(Request $request, int $id): JsonResponse
    {
        $this->desk->rejectDocument($request->user(), $id, $this->reason($request));

        return $this->respondSuccess(null, 'Document rejected.');
    }

    // ── KYC ───────────────────────────────────────────────────────────────────

    public function kyc(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->desk->kyc($request->user()));
    }

    public function downloadKyc(Request $request, int $id): StreamedResponse
    {
        return $this->desk->streamKyc($request->user(), $id);
    }

    public function verifyKyc(Request $request, int $id): JsonResponse
    {
        $this->desk->verifyKyc($request->user(), $id);

        return $this->respondSuccess(null, 'KYC document verified.');
    }

    public function rejectKyc(Request $request, int $id): JsonResponse
    {
        $this->desk->rejectKyc($request->user(), $id, $this->reason($request));

        return $this->respondSuccess(null, 'KYC document rejected.');
    }

    // ── bank accounts ─────────────────────────────────────────────────────────

    public function banks(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->desk->banks($request->user()));
    }

    public function verifyBank(Request $request, int $id): JsonResponse
    {
        $this->desk->verifyBank($request->user(), $id);

        return $this->respondSuccess(null, 'Bank account verified.');
    }

    // ── contact messages ──────────────────────────────────────────────────────

    public function messages(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->desk->messages($request->user()));
    }

    public function handleMessage(Request $request, int $id): JsonResponse
    {
        $this->desk->handleMessage($request->user(), $id);

        return $this->respondSuccess(null, 'Message marked as handled.');
    }

    private function reason(Request $request): string
    {
        return $request->validate(['reason' => ['required', 'string', 'min:3', 'max:255']])['reason'];
    }
}
