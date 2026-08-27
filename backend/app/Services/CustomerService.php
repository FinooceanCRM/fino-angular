<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\CustomerInteraction;
use App\Models\CustomerNote;
use App\Models\User;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Customer Management (Phase 3): row-scoped CRUD, notes and the Activity
 * History timeline. Visibility scoping itself lives in
 * {@see \App\Repositories\EloquentCustomerRepository}; this service enforces
 * the same create/update/note behaviour the mock `CustomerDataProvider` had
 * (status forced to 'prospect' on create, a 'Customer created' interaction,
 * addNote() also logging an interaction, etc).
 */
class CustomerService extends BaseService
{
    public function __construct(
        private readonly CustomerRepositoryInterface $customers,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(User $actor, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->customers->paginateVisible($actor, $filters, $perPage);
    }

    public function findVisible(User $actor, int $id): Customer
    {
        $customer = $this->customers->findVisible($actor, $id);

        if ($customer === null) {
            throw new DomainException('Customer not found or not visible to you.', 404);
        }

        return $customer;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(User $actor, array $attributes): Customer
    {
        return $this->transaction(function () use ($actor, $attributes): Customer {
            $attributes['status'] = 'prospect';
            $attributes['created_by'] = $actor->id;

            $customer = $this->customers->create($attributes);

            CustomerInteraction::query()->create([
                'customer_id' => $customer->id,
                'icon' => 'person_add',
                'title' => 'Customer created',
                'subtitle' => null,
                'created_at' => now(),
            ]);

            $this->auditLog->record(
                $actor,
                'Created',
                'Customer',
                $customer->name,
                sprintf('%s created customer %s.', $actor->name, $customer->name),
                'other',
                $customer->id,
            );

            return $customer;
        });
    }

    /**
     * Merges name/email/phone/segment/notes only — status and linked leads
     * are untouched by this action, matching the mock's update().
     *
     * @param array<string, mixed> $attributes
     */
    public function update(User $actor, Customer $customer, array $attributes): Customer
    {
        $allowed = array_intersect_key($attributes, array_flip(['name', 'email', 'phone', 'segment', 'notes']));

        $updated = $this->customers->update($customer, $allowed);

        $this->auditLog->record(
            $actor,
            'Updated',
            'Customer',
            $updated->name,
            sprintf('%s updated customer %s.', $actor->name, $updated->name),
            'other',
            $updated->id,
        );

        return $updated;
    }

    public function delete(Customer $customer): bool
    {
        return $this->customers->delete($customer);
    }

    /**
     * Links a customer to a lead. Minimal addition beyond the mock (which
     * never exposed linking via the UI beyond seed data) — a real system
     * needs some way to attach a customer to a lead.
     */
    public function linkLead(User $actor, Customer $customer, int $leadId): void
    {
        $customer->leads()->syncWithoutDetaching([$leadId]);
    }

    public function unlinkLead(User $actor, Customer $customer, int $leadId): void
    {
        $customer->leads()->detach($leadId);
    }

    public function addNote(User $actor, Customer $customer, string $text): CustomerNote
    {
        $trimmed = trim($text);

        $note = CustomerNote::query()->create([
            'customer_id' => $customer->id,
            'author_id' => $actor->id,
            'author_name' => $actor->name,
            'body' => $trimmed,
            'created_at' => now(),
        ]);

        $preview = strlen($trimmed) > 60 ? substr($trimmed, 0, 60).'…' : $trimmed;
        $this->logInteraction($actor, $customer, 'edit_note', 'Note added', $preview);

        return $note;
    }

    /** Appends one entry to a customer's Activity History timeline. */
    public function logInteraction(User $actor, Customer $customer, string $icon, string $title, ?string $subtitle = null): CustomerInteraction
    {
        return CustomerInteraction::query()->create([
            'customer_id' => $customer->id,
            'icon' => $icon,
            'title' => $title,
            'subtitle' => $subtitle,
            'created_at' => now(),
        ]);
    }
}
