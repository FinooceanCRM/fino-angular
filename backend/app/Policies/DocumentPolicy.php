<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function view(User $actor, Document $document): bool
    {
        return $actor->is_active;
    }

    public function delete(User $actor, Document $document): bool
    {
        return $document->uploaded_by === $actor->id
            || in_array($actor->roleEnum(), [
                UserRole::SuperAdmin,
                UserRole::Manager,
                UserRole::RelationshipManager,
            ], true);
    }
}
