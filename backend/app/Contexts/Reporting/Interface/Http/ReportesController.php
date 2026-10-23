<?php

namespace App\Contexts\Reporting\Interface\Http;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Reporting\Application\Ports\ConsultasReportes;
use App\Contexts\Reporting\Domain\Periodos;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reportes y dashboard (RF14–RF16, D09, D10). Solo lectura; permisos por ruta (reports.*, dashboard.management).
 * Las fechas "hoy" salen siempre de America/Argentina/Buenos_Aires (APP_TIMEZONE).
 */
final class ReportesController
{
    private const PERIODO = ['regex:/^\d{4}-(0[1-9]|1[0-2])$/'];

    public function __construct(
        private readonly ConsultasReportes $consultas,
        private readonly RegistroAuditoria $auditoria,
    ) {}

    /** RF14: sumatoria quincenal por frente y tipo, y el detalle por unidad y operario. */
    public function quincenal(Request $request): JsonResponse
    {
        $actual = Periodos::quincenaDe(now()->toDateString());
        $f = $request->validate(['periodo' => ['nullable', ...self::PERIODO], 'quincena' => ['nullable', 'integer', 'in:1,2']]);
        $periodo = $f['periodo'] ?? $actual['periodo'];
        $numero = (int) ($f['quincena'] ?? $actual['numero']);
        $rango = Periodos::quincena($periodo, $numero);

        return response()->json(['data' => [
            'periodo' => $periodo, 'quincena' => $numero, ...$rango,
            'en_curso' => $rango['hasta'] >= now()->toDateString(),
            'por_frente' => $this->consultas->produccionPorTipo($rango['desde'], $rango['hasta']),
            'detalle' => $this->consultas->produccion($rango['desde'], $rango['hasta']),
        ]]);
    }

    /** RF16: filtros históricos de producción por fechas, máquina, frente, operario y tipo. */
    public function produccion(Request $request): JsonResponse
    {
        $f = $request->validate([
            'desde' => ['required', 'date_format:Y-m-d'],
            'hasta' => ['required', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'frente' => ['nullable', 'integer'], 'unidad' => ['nullable', 'integer'], 'operario' => ['nullable', 'integer'], 'tipo_madera' => ['nullable', 'integer'],
        ]);
        $filtros = array_filter(array_intersect_key($f, array_flip(['frente', 'unidad', 'operario', 'tipo_madera'])));

        return response()->json(['data' => [
            'desde' => $f['desde'], 'hasta' => $f['hasta'], 'filtros' => $filtros,
            'por_frente' => $this->consultas->produccionPorTipo($f['desde'], $f['hasta'], $filtros),
            'detalle' => $this->consultas->produccion($f['desde'], $f['hasta'], $filtros),
        ]]);
    }

    /** RF16 (D09): consumos importados por período y máquina. Frente y operario no están disponibles en v1. */
    public function consumos(Request $request): JsonResponse
    {
        $f = $request->validate(['desde' => ['required', ...self::PERIODO], 'hasta' => ['required', ...self::PERIODO], 'unidad' => ['nullable', 'integer']]);
        if ($f['hasta'] < $f['desde']) {
            throw new ReglaDeNegocioException('RANGO_INVALIDO', 'El período final no puede ser anterior al inicial.', ['hasta' => ['El período final no puede ser anterior al inicial.']]);
        }
        $filtros = array_filter(['unidad' => $f['unidad'] ?? null]);
        $this->auditarFinanciero('consumos', $f);

        return response()->json(['data' => [
            'desde' => $f['desde'], 'hasta' => $f['hasta'],
            'filas' => $this->consultas->consumos($f['desde'], $f['hasta'], $filtros),
            'totales' => $this->consultas->totalConsumos($f['desde'], $f['hasta'], $filtros),
            'no_disponible' => ['frente', 'operario'],
        ]]);
    }

    /** RF15: consolidado mensual del período vencido: operación + consumos importados. */
    public function mensual(Request $request): JsonResponse
    {
        $hoy = now()->toDateString();
        $vencido = Periodos::periodoVencido($hoy);
        $periodo = $request->validate(['periodo' => ['nullable', ...self::PERIODO]])['periodo'] ?? $vencido;
        $mes = Periodos::mes($periodo);
        $totalConsumos = $this->consultas->totalConsumos($periodo, $periodo);
        $this->auditarFinanciero('mensual', ['periodo' => $periodo]);

        return response()->json(['data' => [
            'periodo' => $periodo, ...$mes,
            'es_periodo_vencido' => $periodo === $vencido,
            // RF15: tiene que estar disponible antes del día 15 del mes siguiente
            'fecha_limite' => date('Y-m-15', strtotime("{$periodo}-01 +1 month")),
            // D21: se informa el lote vigente tal cual (estado, unidades, filas con error); el sistema no afirma completitud
            'lote_vigente' => $this->consultas->loteVigente($periodo),
            'produccion' => $this->consultas->produccionPorTipo($mes['desde'], $mes['hasta']),
            'viajes' => $this->consultas->viajesPorEstado($mes['desde'], $mes['hasta']),
            'operativo' => $this->consultas->indicadoresOperativos($mes['desde'], $mes['hasta'], $hoy),
            'consumos' => $this->consultas->consumos($periodo, $periodo),
            'total_consumos' => $totalConsumos,
        ]]);
    }

    /** Reporte operativo (reports.operational): logística y mantenimiento en un rango. */
    public function operativo(Request $request): JsonResponse
    {
        $f = $request->validate(['desde' => ['required', 'date_format:Y-m-d'], 'hasta' => ['required', 'date_format:Y-m-d', 'after_or_equal:desde']]);

        return response()->json(['data' => [
            ...$f,
            'viajes' => $this->consultas->viajesPorEstado($f['desde'], $f['hasta']),
            'indicadores' => $this->consultas->indicadoresOperativos($f['desde'], $f['hasta'], now()->toDateString()),
        ]]);
    }

    /** Dashboard gerencial: quincena en curso, pendientes y último consolidado de consumos. */
    public function dashboard(): JsonResponse
    {
        $hoy = now()->toDateString();
        $q = Periodos::quincenaDe($hoy);
        $rango = Periodos::quincena($q['periodo'], $q['numero']);
        $vencido = Periodos::periodoVencido($hoy);
        $desde30 = now()->subDays(29)->toDateString();

        return response()->json(['data' => [
            'hoy' => $hoy,
            'quincena' => ['periodo' => $q['periodo'], 'numero' => $q['numero'], ...$rango, 'por_frente' => $this->consultas->produccionPorTipo($rango['desde'], $hoy)],
            'viajes_quincena' => $this->consultas->viajesPorEstado($rango['desde'], $hoy),
            'operativo' => $this->consultas->indicadoresOperativos($rango['desde'], $hoy, $hoy),
            'consumos_vencido' => [
                'periodo' => $vencido, 'fecha_limite' => date('Y-m-15', strtotime("{$vencido}-01 +1 month")),
                ...$this->consultas->totalConsumos($vencido, $vencido), 'lote_vigente' => $this->consultas->loteVigente($vencido),
            ],
            'serie_30_dias' => ['desde' => $desde30, 'hasta' => $hoy, 'filas' => $this->consultas->produccionDiaria($desde30, $hoy)],
        ]]);
    }

    /** El acceso a información financiera queda auditado (skill indufor-managerial-reporting, regla 5). */
    private function auditarFinanciero(string $reporte, array $filtros): void
    {
        $this->auditoria->registrar('reporting', 'reporte_financiero.consultado', 'reporte', $reporte, null, $filtros);
    }
}
