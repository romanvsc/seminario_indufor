<?php

namespace App\Contexts\Shared\Domain;

/**
 * Violación de una regla de negocio. La API la devuelve como 422 con un código estable
 * (formato de error: docs/adr/ADR-002-formato-errores-api.md).
 */
class ReglaDeNegocioException extends \DomainException
{
    /** @param array<string, mixed> $details */
    public function __construct(
        public readonly string $codigo,
        string $mensaje,
        public readonly array $details = [],
    ) {
        parent::__construct($mensaje);
    }
}
