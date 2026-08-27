<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Global search (Phase 1). Any authenticated user may search — results are
 * scoped to their own visibility by {@see SearchService}, so no extra
 * Policy/permission gate is needed beyond normal auth.
 */
class SearchController extends BaseApiController
{
    public function __construct(private readonly SearchService $search)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $term = (string) $request->query('q', '');

        return $this->respondSuccess([
            'results' => $this->search->search($request->user(), $term, $this->parseTypes($request)),
            'counts' => $this->search->countsByType($request->user(), $term),
        ]);
    }

    /**
     * Accepts `type[]=lead&type[]=user` (array), `type=lead,user`
     * (comma-separated) or `type=lead` (single value).
     *
     * @return array<int, string>|null
     */
    private function parseTypes(Request $request): ?array
    {
        $raw = $request->query('type');

        if (is_array($raw)) {
            $types = $raw;
        } elseif (is_string($raw) && $raw !== '') {
            $types = explode(',', $raw);
        } else {
            return null;
        }

        $types = array_values(array_filter($types, static fn ($t): bool => is_string($t) && $t !== ''));

        return $types === [] ? null : $types;
    }
}
