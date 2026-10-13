<?php

namespace App\Contexts\Maquinaria\Application\Ports;

/** $entidad es 'tipo_maquinaria' o 'maquinaria'. */
interface MaquinariaRepositorio
{
    /** @param array<string, mixed> $datos */
    public function crear(string $entidad, array $datos): int;

    /** @param array<string, mixed> $datos */
    public function actualizar(string $entidad, int $id, array $datos): void;

    /** @return array<string, mixed>|null */
    public function snapshot(string $entidad, int $id): ?array;
}
