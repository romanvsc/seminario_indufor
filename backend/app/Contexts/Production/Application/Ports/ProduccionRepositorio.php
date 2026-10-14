<?php

namespace App\Contexts\Production\Application\Ports;

use App\Contexts\Frentes\Domain\ModalidadProduccion;

interface ProduccionRepositorio
{
    /** Modalidad del frente, o null si no existe o está deshabilitado. */
    public function modalidadDeFrente(int $idFrente): ?ModalidadProduccion;

    /** ¿El usuario estaba asignado al frente en esa fecha? (D12) */
    public function estaAsignado(int $idUsuario, int $idFrente, string $fecha): bool;

    /** @param array<string, mixed> $datos */
    public function crear(array $datos): int;

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): void;

    /** @return array<string, mixed>|null */
    public function snapshot(int $id): ?array;
}
