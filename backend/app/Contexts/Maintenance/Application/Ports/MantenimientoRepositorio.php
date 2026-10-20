<?php

namespace App\Contexts\Maintenance\Application\Ports;

use App\Contexts\Maquinaria\Domain\Metrica;

interface MantenimientoRepositorio
{
    /**
     * Toma la fila de la unidad hasta el commit (D08: dos cargas simultáneas se validan de a una)
     * y devuelve su métrica, o null si no existe o está deshabilitada.
     */
    public function bloquearUnidad(int $idUnidad): ?Metrica;

    /**
     * Lectura con valor más cercana a $fecha en la métrica indicada.
     *
     * @return array{valor: string, fecha: string}|null
     */
    public function lecturaVecina(int $idUnidad, Metrica $metrica, string $fecha, bool $anterior): ?array;

    /** @param array<string, mixed> $datos */
    public function crearLectura(array $datos): int;

    /** @return array<string, mixed>|null */
    public function lectura(int $idLectura, bool $bloquear = false): ?array;

    /** @param array<string, mixed> $datos */
    public function actualizarLectura(int $idLectura, array $datos): void;

    public function unidadActiva(int $idUnidad): bool;

    /** @param array<string, mixed> $datos */
    public function crearControl(array $datos): int;

    /** @return array<string, mixed>|null */
    public function control(int $idControl): ?array;
}
