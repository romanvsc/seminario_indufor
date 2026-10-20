<?php

namespace App\Contexts\Logistics\Application\Ports;

interface LogisticaRepositorio
{
    /** Nombre del frente si existe y está activo. */
    public function nombreFrenteActivo(int $idFrente): ?string;

    /** @param array<string, mixed> $datos */
    public function crearViaje(array $datos): int;

    /**
     * Viaje con lo necesario para cotejar. $bloquear toma la fila hasta el commit (un cotejo por vez).
     *
     * @return array<string, mixed>|null
     */
    public function viaje(int $idViaje, bool $bloquear = false): ?array;

    /** @param array<string, mixed> $datos */
    public function actualizarViaje(int $idViaje, array $datos): void;

    /** @param array<string, mixed> $datos */
    public function crearRemito(array $datos): void;

    /** @return array<string, mixed>|null */
    public function remitoDeViaje(int $idViaje): ?array;

    /** @param array<string, mixed> $datos */
    public function actualizarRemito(string $numero, array $datos): void;

    public function existeRemito(string $numero): bool;

    public function crearSolicitud(int $idViaje, string $detalle): int;

    /** @return array<string, mixed>|null */
    public function solicitud(int $idSolicitud, bool $bloquear = false): ?array;

    /** @param array<string, mixed> $datos */
    public function actualizarSolicitud(int $idSolicitud, array $datos): void;

    /** Nombre visible de un tipo de madera y de un usuario, para el detalle de diferencias. */
    public function nombreTipoMadera(int $id): string;

    public function nombreUsuario(int $id): string;
}
