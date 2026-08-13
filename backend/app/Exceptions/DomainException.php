<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Base exception for business-rule failures raised by the service layer.
 */
class DomainException extends RuntimeException
{
    /**
     * @param array<string, mixed> $errors
     */
    public function __construct(
        string $message = 'Domain rule violation.',
        protected int $status = 422,
        protected array $errors = [],
    ) {
        parent::__construct($message);
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    /**
     * @return array<string, mixed>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
