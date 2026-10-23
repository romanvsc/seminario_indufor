<?php

namespace App\Contexts\Reporting\Application\Ports;

/**
 * Modelo de lectura de Reporting. No escribe nada: consulta los registros fuente de cada contexto,
 * así cada total se puede reproducir y explicar (D10: calculado al consultar, sin cierres congelados).
 * Toneladas y m³ siempre por separado; pulpable y aserrable siempre por separado.
 */
interface ConsultasReportes
{
    /**
     * @param  array{frente?: int, unidad?: int, operario?: int, tipo_madera?: int}  $filtros
     * @return list<array<string, mixed>> filas agrupadas por frente, unidad, operario y tipo
     */
    public function produccion(string $desde, string $hasta, array $filtros = []): array;

    /** @return list<array<string, mixed>> totales por tipo de madera (toneladas y m³ separados) */
    public function produccionPorTipo(string $desde, string $hasta, array $filtros = []): array;

    /** @return list<array<string, mixed>> por día y tipo, para la serie del dashboard */
    public function produccionDiaria(string $desde, string $hasta): array;

    /** @return list<array<string, mixed>> viajes por estado: cantidad y toneladas declaradas */
    public function viajesPorEstado(string $desde, string $hasta): array;

    /** @return array<string, int> indicadores operativos de mantenimiento y logística */
    public function indicadoresOperativos(string $desde, string $hasta, string $hoy): array;

    /**
     * @param  array{unidad?: int}  $filtros
     * @return list<array<string, mixed>> consumos importados por período y unidad (D09: sin frente ni operario)
     */
    public function consumos(string $periodoDesde, string $periodoHasta, array $filtros = []): array;

    /**
     * Lote de consumos vigente del período (OK o PARCIAL), o null si no se importó. Nunca implica "período completo" (D21).
     *
     * @return array{id: int, estado: string, archivo: ?string, fecha: string, unidades: int, filas_con_error: int}|null
     */
    public function loteVigente(string $periodo): ?array;

    /** @return array{litros: string, costo_total: string, unidades: int} */
    public function totalConsumos(string $periodoDesde, string $periodoHasta, array $filtros = []): array;
}
