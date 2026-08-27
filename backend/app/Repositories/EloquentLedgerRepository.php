<?php

namespace App\Repositories;

use App\Models\LedgerEntry;
use App\Repositories\Contracts\LedgerRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentLedgerRepository implements LedgerRepositoryInterface
{
    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): LedgerEntry
    {
        return LedgerEntry::query()->create($attributes);
    }

    /**
     * @return Collection<int, LedgerEntry>
     */
    public function allChronological(): Collection
    {
        return LedgerEntry::query()->orderBy('date')->orderBy('id')->get();
    }
}
