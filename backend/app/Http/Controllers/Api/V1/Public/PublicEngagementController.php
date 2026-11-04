<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\UserRole;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Public\SendContactMessageRequest;
use App\Http\Requests\Public\SubscribeNewsletterRequest;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

/** Contact-page messages and newsletter sign-ups (unauthenticated, throttled). */
class PublicEngagementController extends BaseApiController
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function contact(SendContactMessageRequest $request): JsonResponse
    {
        // Honeypot: bots see the same success, nothing is stored.
        if (blank($request->input('website'))) {
            $data = $request->validated();

            $message = ContactMessage::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'inquiry_type' => $data['inquiry_type'],
                'message' => $data['message'],
                'ip_address' => $request->ip(),
            ]);

            $this->notifications->notifyMany(
                User::query()
                    ->whereIn('role', [UserRole::SuperAdmin->value, UserRole::Telecaller->value])
                    ->where('is_active', true)->pluck('id')->all(),
                'contact.message',
                'New website message',
                sprintf('%s (%s, %s) — %s: %s', $message->name, $message->phone, $message->email, $message->inquiry_type, mb_strimwidth($message->message, 0, 200, '…')),
                ['contact_message_id' => $message->id],
            );
        }

        return $this->respondCreated(null, 'Thank you. Your message has been received and our team will get back to you shortly.');
    }

    public function subscribe(SubscribeNewsletterRequest $request): JsonResponse
    {
        if (blank($request->input('website'))) {
            // Re-subscribing is a no-op, and looks identical to a new sign-up.
            NewsletterSubscriber::query()->firstOrCreate(
                ['email' => strtolower((string) $request->input('email'))],
                ['ip_address' => $request->ip()],
            );
        }

        return $this->respondCreated(null, 'Thanks for subscribing!');
    }
}
