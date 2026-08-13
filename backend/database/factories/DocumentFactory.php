<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\LoanLead;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = Str::random(8).'.pdf';

        return [
            'loan_lead_id' => LoanLead::factory(),
            'uploaded_by' => null,
            'document_type' => $this->faker->randomElement(['pan', 'aadhaar', 'salary_slip', 'bank_statement', 'itr']),
            'original_name' => $name,
            'path' => 'documents/'.$name,
            'mime_type' => 'application/pdf',
            'size_bytes' => $this->faker->numberBetween(10000, 5000000),
            'status' => 'pending',
        ];
    }
}
