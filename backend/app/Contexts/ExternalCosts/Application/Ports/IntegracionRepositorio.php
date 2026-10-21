<?php

namespace App\Contexts\ExternalCosts\Application\Ports;

interface IntegracionRepositorio
{
    /** @return list<int> lecturas con valor que todavía no tienen una exportación OK */
    public function lecturasPendientes(): array;

    /**
     * Datos de la lectura en el modelo interno, o null si no tiene valor que exportar.
     *
     * @return array{id_lectura: int, codigo_unidad: string, fecha_lectura: string, metrica: string, valor: string}|null
     */
    public function lecturaExportable(int $idLectura): ?array;

    public function exportacionOk(int $idLectura): bool;

    /** @param array<string, mixed> $datos */
    public function crearLote(array $datos): int;

    /** @param array<string, mixed> $datos */
    public function actualizarLote(int $idLote, array $datos): void;

    /** @return array<string, mixed>|null */
    public function lote(int $idLote): ?array;

    /** Lote de importación vigente (OK o PARCIAL) con ese checksum. */
    public function importacionPorChecksum(string $checksum): ?int;

    /** @return list<int> lotes de importación vigentes del período */
    public function importacionesDelPeriodo(string $periodo): array;

    public function unidadPorCodigo(string $codigo): ?int;

    /** @param list<array{id_unidad: int, litros: string, costo_total: string, referencia: ?string}> $lineas */
    public function insertarConsumos(int $idLote, string $periodo, array $lineas): void;

    public function borrarConsumosDelPeriodo(string $periodo): int;
}
