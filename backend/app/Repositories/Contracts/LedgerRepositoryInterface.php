<?php

namespace App\Repositories\Contracts;

use App\Models\LedgerEntry;
use Illuminate\Database\Eloquent\Collection;

interface LedgerRepositoryInterface
{
    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): LedgerEntry;

    /**
     * Every ledger row, oldest first (then by id for same-day ties) — the
     * chronological order a running balance must be computed in.
     *
     * @return Collection<int, LedgerEntry>
     */
    public function allChronological(): Collection;
}
