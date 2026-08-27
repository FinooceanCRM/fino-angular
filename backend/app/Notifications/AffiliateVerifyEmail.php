<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliateVerifyEmail extends Notification
{
    public function __construct(private readonly string $verificationUrl)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify your FINOOCEAN affiliate account')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Thanks for signing up as a FINOOCEAN affiliate. Please verify your email address to activate your account.')
            ->action('Verify Email Address', $this->verificationUrl)
            ->line('This link expires in 60 minutes.')
            ->line('If you did not create an affiliate account, no further action is required.');
    }
}
