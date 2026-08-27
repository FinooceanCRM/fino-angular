<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ApprovalComment
 */
class ApprovalCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $author = $this->whenLoaded('author');

        return [
            'id' => $this->id,
            'author' => $author instanceof User ? $author->name : 'System',
            'body' => $this->body,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
