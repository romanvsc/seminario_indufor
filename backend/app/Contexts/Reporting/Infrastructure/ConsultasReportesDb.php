<?php

namespace App\Contexts\Reporting\Infrastructure;

use App\Contexts\Reporting\Application\Ports\ConsultasReportes;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/** Consultas de agregación sobre los registros fuente. Las sumas se hacen en SQL sobre DECIMAL: nunca float. */
final class ConsultasReportesDb implements ConsultasReportes
{
    public function produccion(string $desde, string $hasta, array $filtros = []): array
    {
        return $this->filas($this->baseProduccion($desde, $hasta, $filtros)
            ->leftJoin('usuario as o', 'o.id_usuario', '=', 'p.id_operario')
            ->groupBy('f.id_frente', 'f.nombre_frente', 'm.id_unidad', 'm.nombre', 'o.id_usuario', 'o.nombre', 'o.apellido', 't.id_tipo_madera', 't.nombre')
            ->orderBy('f.nombre_frente')->orderBy('m.nombre')->orderBy('t.nombre')
            ->select([
                'f.id_frente', 'f.nombre_frente as frente', 'm.id_unidad', 'm.nombre as unidad',
                'o.id_usuario as id_operario', DB::raw("CASE WHEN o.id_usuario IS NULL THEN NULL ELSE CONCAT(o.apellido, ', ', o.nombre) END as operario"),
                't.nombre as tipo_madera', DB::raw('SUM(p.cantidad_toneladas) as toneladas'), DB::raw('SUM(p.metros_cubicos) as metros_cubicos'), DB::raw('COUNT(*) as partes'),
            ]));
    }

    public function produccionPorTipo(string $desde, string $hasta, array $filtros = []): array
    {
        return $this->filas($this->baseProduccion($desde, $hasta, $filtros)
            ->groupBy('f.id_frente', 'f.nombre_frente', 't.id_tipo_madera', 't.nombre')
            ->orderBy('f.nombre_frente')->orderBy('t.nombre')
            ->select(['f.id_frente', 'f.nombre_frente as frente', 't.nombre as tipo_madera', DB::raw('SUM(p.cantidad_toneladas) as toneladas'), DB::raw('SUM(p.metros_cubicos) as metros_cubicos'), DB::raw('COUNT(*) as partes')]));
    }

    public function produccionDiaria(string $desde, string $hasta): array
    {
        return $this->filas($this->baseProduccion($desde, $hasta)
            ->groupBy('p.fecha_registro', 't.nombre')->orderBy('p.fecha_registro')
            ->select([DB::raw('p.fecha_registro as fecha'), 't.nombre as tipo_madera', DB::raw('SUM(p.cantidad_toneladas) as toneladas'), DB::raw('SUM(p.metros_cubicos) as metros_cubicos')]));
    }

    public function viajesPorEstado(string $desde, string $hasta): array
    {
        return $this->filas(DB::table('viaje_logistica')
            ->whereBetween('fecha', ["{$desde} 00:00:00", "{$hasta} 23:59:59"])
            ->groupBy('estado_validacion')->orderBy('estado_validacion')
            ->select(['estado_validacion as estado', DB::raw('COUNT(*) as viajes'), DB::raw('SUM(volumen_declarado) as toneladas')]));
    }

    public function indicadoresOperativos(string $desde, string $hasta, string $hoy): array
    {
        $lunes = date('Y-m-d', strtotime('monday this week', strtotime($hoy)));
        $ultimoControl = DB::table('control_matafuego as c')->whereColumn('c.id_unidad', 'm.id_unidad')->orderByDesc('fecha_revision')->orderByDesc('id_control')->limit(1);

        return [
            'lecturas' => DB::table('lectura_mantenimiento')->whereBetween('fecha_lectura', ["{$desde} 00:00:00", "{$hasta} 23:59:59"])->count(),
            'fallas_reportadas' => DB::table('lectura_mantenimiento')->where('tiene_falla', true)->whereBetween('fecha_lectura', ["{$desde} 00:00:00", "{$hasta} 23:59:59"])->count(),
            'fallas_abiertas' => DB::table('lectura_mantenimiento')->where('tiene_falla', true)->whereNull('falla_atendida_at')->count(),
            'solicitudes_abiertas' => DB::table('solicitud_correccion')->where('estado', '!=', 'RESUELTA')->count(),
            'unidades_activas' => DB::table('maquinaria')->where('estado_activo', true)->count(),
            'unidades_sin_lectura_semana' => DB::table('maquinaria as m')->where('m.estado_activo', true)
                ->whereNotExists(fn (Builder $q) => $q->from('lectura_mantenimiento as l')->whereColumn('l.id_unidad', 'm.id_unidad')->where('l.fecha_lectura', '>=', "{$lunes} 00:00:00"))->count(),
            'matafuegos_vencidos' => DB::table('maquinaria as m')->where('m.estado_activo', true)
                ->where((clone $ultimoControl)->select('fecha_vencimiento_carga'), '<', $hoy)->count(),
        ];
    }

    public function consumos(string $periodoDesde, string $periodoHasta, array $filtros = []): array
    {
        return $this->filas($this->baseConsumos($periodoDesde, $periodoHasta, $filtros)
            ->join('maquinaria as m', 'm.id_unidad', '=', 'c.id_unidad')
            ->orderBy('c.periodo')->orderBy('m.nombre')
            ->select(['c.periodo', 'm.id_unidad', 'm.nombre as unidad', 'm.dominio_patente', 'c.litros', 'c.costo_total', 'c.referencia_externa']));
    }

    public function totalConsumos(string $periodoDesde, string $periodoHasta, array $filtros = []): array
    {
        $t = $this->baseConsumos($periodoDesde, $periodoHasta, $filtros)
            ->selectRaw('COALESCE(SUM(c.litros), 0) as litros, COALESCE(SUM(c.costo_total), 0) as costo_total, COUNT(DISTINCT c.id_unidad) as unidades')->first();

        return ['litros' => (string) $t->litros, 'costo_total' => (string) $t->costo_total, 'unidades' => (int) $t->unidades];
    }

    public function loteVigente(string $periodo): ?array
    {
        $l = DB::table('integracion_lote')->where('tipo', 'IMPORT_CONSUMOS')->where('periodo', $periodo)
            ->whereIn('estado', ['OK', 'PARCIAL'])->orderByDesc('id_lote')->first();

        return $l === null ? null : [
            'id' => (int) $l->id_lote,
            'estado' => $l->estado,
            'archivo' => $l->nombre_archivo,
            'fecha' => substr((string) ($l->finalizado_at ?? $l->iniciado_at), 0, 16),
            'unidades' => DB::table('consumo_importado')->where('id_lote', $l->id_lote)->count(),
            'filas_con_error' => $l->detalle_error ? count(json_decode($l->detalle_error, true) ?: []) : 0,
        ];
    }

    private function baseProduccion(string $desde, string $hasta, array $filtros = []): Builder
    {
        return DB::table('produccion as p')
            ->join('frente_trabajo as f', 'f.id_frente', '=', 'p.id_frente')
            ->join('maquinaria as m', 'm.id_unidad', '=', 'p.id_unidad')
            ->join('tipo_madera as t', 't.id_tipo_madera', '=', 'p.tipo_madera')
            ->whereBetween('p.fecha_registro', [$desde, $hasta])
            ->when($filtros['frente'] ?? null, fn ($q, $v) => $q->where('p.id_frente', $v))
            ->when($filtros['unidad'] ?? null, fn ($q, $v) => $q->where('p.id_unidad', $v))
            ->when($filtros['operario'] ?? null, fn ($q, $v) => $q->where('p.id_operario', $v))
            ->when($filtros['tipo_madera'] ?? null, fn ($q, $v) => $q->where('p.tipo_madera', $v));
    }

    private function baseConsumos(string $desde, string $hasta, array $filtros = []): Builder
    {
        return DB::table('consumo_importado as c')->whereBetween('c.periodo', [$desde, $hasta])
            ->when($filtros['unidad'] ?? null, fn ($q, $v) => $q->where('c.id_unidad', $v));
    }

    /** @return list<array<string, mixed>> */
    private function filas(Builder $q): array
    {
        return $q->get()->map(fn ($r) => (array) $r)->all();
    }
}
