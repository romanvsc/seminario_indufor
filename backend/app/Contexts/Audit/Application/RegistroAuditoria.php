<?php

namespace App\Contexts\Audit\Application;

/**
 * Puerto de auditoría (skill indufor-traceability-audit). Se invoca desde los casos de uso,
 * dentro de la misma transacción que el cambio: si el cambio se revierte, el evento también.
 */
interface RegistroAuditoria
{
    /**
     * @param  array<string, mixed>|null  $antes
     * @param  array<string, mixed>|null  $despues
     */
    public function registrar(
        string $boundedContext,
        string $accion,
        string $entidad,
        string|int|null $entidadId,
        ?array $antes = null,
        ?array $despues = null,
    ): void;
}
