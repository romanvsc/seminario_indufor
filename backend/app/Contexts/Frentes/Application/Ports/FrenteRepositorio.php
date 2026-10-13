<?php

namespace App\Contexts\Frentes\Application\Ports;

interface FrenteRepositorio
{
    /** @param array<string, mixed> $datos */
    public function crear(array $datos): int;

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): void;

    /** @return array<string, mixed>|null */
    public function snapshot(int $id): ?array;

    public function crearAsignacion(int $idFrente, int $idUsuario, string $desde, ?string $hasta): int;

    public function finalizarAsignacion(int $idAsignacion, string $hasta): void;

    /** @return array{id_asignacion: int, id_frente: int, id_usuario: int, fecha_desde: string, fecha_hasta: ?string}|null */
    public function asignacion(int $idAsignacion): ?array;

    /** ¿El usuario ya tiene una asignación a ese frente que se cruza con [desde, hasta]? (hasta null = abierta) */
    public function haySuperposicion(int $idFrente, int $idUsuario, string $desde, ?string $hasta): bool;
}
