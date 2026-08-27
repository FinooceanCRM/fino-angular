<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CustomerNote
 */
class CustomerNoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author' => $this->author_name,
            'text' => $this->body,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
