<?php

namespace App\Contexts\Reporting\Interface\Http;

use App\Contexts\ExternalCosts\Application\Ports\IntegracionRepositorio;
use App\Contexts\ExternalCosts\Infrastructure\ConsumoModel;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\Logistics\Domain\EstadoViaje;
use App\Contexts\Logistics\Infrastructure\SolicitudModel;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Reporting\Domain\Periodos;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

/**
 * Spec 07 (T-07.1, D26): pendientes del inicio. Solo conteos, y cada uno solo si el usuario tiene el permiso que lo
 * habilita (I-07.1): una clave ausente significa "no te corresponde", no "cero".
 */
final class PendientesController
{
    public function __construct(private readonly IntegracionRepositorio $integracion) {}

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
            $p['unidades_sin_lectura_semana'] = UnidadModel::where('estado_activo', true)
                ->where(fn ($q) => $q->where('id_usuario', $yo)->orWhereIn('id_frente_actual', $frentes))
                ->whereNotExists(fn ($q) => $q->from('lectura_mantenimiento as l')->whereColumn('l.id_unidad', 'maquinaria.id_unidad')->where('l.fecha_lectura', '>=', $lunes))
                ->count();
        }
        if ($puede(Permiso::TripCreate)) {
            $mios = fn (EstadoViaje $e) => ViajeModel::where('id_usuario_camionero', $yo)->where('estado_validacion', $e->value)->count();
            $p['mis_viajes_pendientes'] = $mios(EstadoViaje::Pendiente);
            $p['mis_viajes_en_correccion'] = $mios(EstadoViaje::CorreccionSolicitada);
        }
        if ($puede(Permiso::RemitoCreate)) {
            $p['viajes_sin_remito'] = ViajeModel::where('estado_validacion', EstadoViaje::Pendiente->value)->doesntHave('remito')->count();
        }
        if ($puede(Permiso::CorrectionManage)) {
            $p['correcciones_abiertas'] = SolicitudModel::where('estado', '!=', 'RESUELTA')->count();
        }
        if ($puede(Permiso::IntegrationExportReadings)) {
            $p['lecturas_sin_exportar'] = count($this->integracion->lecturasPendientes());
        }
        if ($puede(Permiso::IntegrationImportCosts)) {
            // RF15: el consolidado del período vencido se espera antes del día 15
            $vencido = Periodos::periodoVencido($hoy);
            $p['consumos_periodo_vencido'] = ['periodo' => $vencido, 'importado' => ConsumoModel::where('periodo', $vencido)->exists()];
        }
        if ($puede(Permiso::FailureView)) {
            $p['fallas_abiertas'] = LecturaModel::where('tiene_falla', true)->whereNull('falla_atendida_at')->count();
            $vencimiento = ControlMatafuegoModel::select('fecha_vencimiento_carga')->whereColumn('id_unidad', 'maquinaria.id_unidad')
                ->orderByDesc('fecha_revision')->orderByDesc('id_control')->limit(1);
            $p['matafuegos_vencidos'] = UnidadModel::where('estado_activo', true)->where($vencimiento, '<', $hoy)->count();
        }

        return response()->json(['data' => $p]);
    }
}
