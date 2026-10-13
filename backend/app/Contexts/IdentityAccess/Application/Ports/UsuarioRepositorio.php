<?php

namespace App\Contexts\IdentityAccess\Application\Ports;

/** Persistencia de usuarios. Los snapshots nunca incluyen la contraseña. */
interface UsuarioRepositorio
{
    /** @param array<string, mixed> $datos */
    public function crear(array $datos): int;

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): void;

    /** @param list<string> $codigosRol */
    public function sincronizarRoles(int $id, array $codigosRol): void;

    /** @return array<string, mixed>|null */
    public function snapshot(int $id): ?array;
}
