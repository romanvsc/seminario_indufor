<?php

namespace App\Contexts\Reporting\Interface\Http;

use App\Contexts\ExternalCosts\Application\Ports\IntegracionRepositorio;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\Logistics\Domain\EstadoViaje;
use App\Contexts\Logistics\Infrastructure\SolicitudModel;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Reporting\Application\Ports\ConsultasReportes;
use App\Contexts\Reporting\Domain\Periodos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

/**
 * Spec 07 (T-07.1, D26) y rediseño del inicio (2026-11-03): pendientes con su contexto (cuáles, desde cuándo),
 * no solo conteos. Cada clave aparece solo si el usuario tiene el permiso que la habilita (I-07.1): una clave
 * ausente significa "no te corresponde", no "cero". La gravedad la decide el frontend (features/inicio/reglas.ts).
 */
final class PendientesController
{
    private const MUESTRA = 3;

    public function __construct(
        private readonly IntegracionRepositorio $integracion,
        private readonly ConsultasReportes $consultas,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $yo = $request->user()->id_usuario;
        $hoy = now()->toDateString();
        $puede = fn (Permiso $p) => Gate::allows($p->value);
        $p = [];

        if ($puede(Permiso::ReadingCreate)) {
            // RF09: unidades que el usuario puede leer (D28: a cargo o de su frente hoy) sin lectura desde el lunes
            $lunes = now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d H:i:s');
            $frentes = AsignacionModel::where('id_usuario', $yo)->where('fecha_desde', '<=', $hoy)
                ->where(fn ($q) => $q->whereNull('fecha_hasta')->orWhere('fecha_hasta', '>=', $hoy))->pluck('id_frente');
            $sinLectura = UnidadModel::with('frente')->where('estado_activo', true)
                ->where(fn ($q) => $q->where('id_usuario', $yo)->orWhereIn('id_frente_actual', $frentes))
                ->whereNotExists(fn ($q) => $q->from('lectura_mantenimiento as l')->whereColumn('l.id_unidad', 'maquinaria.id_unidad')->where('l.fecha_lectura', '>=', $lunes))
                ->orderBy('nombre');
            $p['unidades_sin_lectura_semana'] = $this->conjunto($sinLectura, fn (UnidadModel $u) => ['id' => $u->id_unidad, 'nombre' => $u->nombre, 'frente' => $u->frente?->nombre_frente]);
        }
        if ($puede(Permiso::TripCreate)) {
            $mios = fn (EstadoViaje $e) => $this->conjunto(
                ViajeModel::where('id_usuario_camionero', $yo)->where('estado_validacion', $e->value)->orderBy('fecha'),
                fn (ViajeModel $v) => ['id' => $v->id_viaje, 'fecha' => $v->fecha->format('Y-m-d H:i'), 'destino' => $v->destino],
            );
            $p['mis_viajes_pendientes'] = $mios(EstadoViaje::Pendiente);
            $p['mis_viajes_en_correccion'] = $mios(EstadoViaje::CorreccionSolicitada);
        }
        if ($puede(Permiso::RemitoCreate)) {
            $p['viajes_sin_remito'] = $this->conjunto(
                ViajeModel::with(['origen', 'camionero'])->where('estado_validacion', EstadoViaje::Pendiente->value)->doesntHave('remito')->orderBy('fecha'),
                fn (ViajeModel $v) => ['id' => $v->id_viaje, 'fecha' => $v->fecha->format('Y-m-d H:i'), 'origen' => $v->origen->nombre_frente,
                    'camionero' => "{$v->camionero->apellido}, {$v->camionero->nombre}"],
            );
        }
        if ($puede(Permiso::CorrectionManage)) {
            $p['correcciones_abiertas'] = $this->conjunto(
                SolicitudModel::where('estado', '!=', 'RESUELTA')->orderBy('fecha_solicitud'),
                fn (SolicitudModel $s) => ['id' => $s->id_solicitud, 'fecha' => substr((string) $s->fecha_solicitud, 0, 16), 'viaje' => $s->id_viaje],
            );
        }
        if ($puede(Permiso::IntegrationExportReadings)) {
            // RF12: la exportación es automática; una lectura pendiente es una anomalía del envío, no una tarea habitual
            $ids = $this->integracion->lecturasPendientes();
            $p['lecturas_sin_exportar'] = $this->conjunto(
                LecturaModel::with('unidad')->whereIn('id_lectura', $ids)->orderBy('fecha_lectura'),
                fn (LecturaModel $l) => ['id' => $l->id_lectura, 'fecha' => $l->fecha_lectura->format('Y-m-d H:i'), 'unidad' => $l->unidad->nombre],
            );
        }
        if ($puede(Permiso::IntegrationImportCosts)) {
            // RF15: el consolidado del período vencido se espera antes del día 15. El lote vigente distingue
            // "no importado" de "importado con filas con error" (D21); la mera existencia de consumos no alcanza.
            $vencido = Periodos::periodoVencido($hoy);
            $limite = date('Y-m-15', strtotime("{$vencido}-01 +1 month"));
            $p['consumos_periodo_vencido'] = [
                'periodo' => $vencido,
                'fecha_limite' => $limite,
                'plazo_vencido' => $hoy > $limite,
                'lote' => $this->consultas->loteVigente($vencido),
            ];
        }
        if ($puede(Permiso::FailureView)) {
            $p['fallas_abiertas'] = $this->conjunto(
                LecturaModel::with('unidad.frente')->where('tiene_falla', true)->whereNull('falla_atendida_at')->orderBy('fecha_lectura'),
                fn (LecturaModel $l) => ['id' => $l->id_lectura, 'fecha' => $l->fecha_lectura->format('Y-m-d H:i'), 'unidad' => $l->unidad->nombre,
                    'frente' => $l->unidad->frente?->nombre_frente, 'detalle' => $l->detalle_falla],
            );
            $vencimiento = ControlMatafuegoModel::select('fecha_vencimiento_carga')->whereColumn('id_unidad', 'maquinaria.id_unidad')
                ->orderByDesc('fecha_revision')->orderByDesc('id_control')->limit(1);
            $p['matafuegos_vencidos'] = $this->conjunto(
                UnidadModel::where('estado_activo', true)->where($vencimiento, '<', $hoy)->addSelect(['vencimiento' => $vencimiento])->orderBy('nombre'),
                fn (UnidadModel $u) => ['id' => $u->id_unidad, 'nombre' => $u->nombre, 'vencimiento' => $u->vencimiento],
            );
        }

        return response()->json(['data' => $p, 'meta' => ['generado_at' => now()->format('Y-m-d H:i:s')]]);
    }

    /**
     * Cantidad total y los primeros casos (los más antiguos según el orden de la consulta), para identificar qué atender.
     *
     * @param  Builder<Model>  $consulta
     * @return array{cantidad: int, items: list<array<string, mixed>>}
     */
    private function conjunto($consulta, callable $fila): array
    {
        return ['cantidad' => (clone $consulta)->count(), 'items' => $consulta->limit(self::MUESTRA)->get()->map($fila)->values()->all()];
    }
}
