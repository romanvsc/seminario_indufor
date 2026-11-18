<?php

namespace App\Contexts\Audit\Interface\Http;

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Actividad reciente del inicio (rediseño del 2026-11-03, P2). Sale de auditoria_evento, solo con acciones
 * operativas: nunca usuarios, permisos ni consultas financieras. Con audit.view se ve toda la operación;
 * sin ese permiso, solo lo propio.
 */
final class ActividadController
{
    public const ACCIONES = [
        'produccion.registrada', 'produccion.corregida', 'viaje.declarado', 'remito.cargado', 'remito.corregido',
        'solicitud.creada', 'solicitud.resuelta', 'lectura.registrada', 'falla.reportada', 'falla.atendida',
        'matafuego.controlado', 'consumos.importados', 'consumos.reemplazados',
    ];

    public function __invoke(Request $request): JsonResponse
    {
        $eventos = AuditoriaEventoModel::query()->whereIn('accion', self::ACCIONES)
            ->when(! Gate::allows(Permiso::AuditView->value), fn ($q) => $q->where('id_usuario', $request->user()->id_usuario))
            ->orderByDesc('created_at')->orderByDesc('id_evento')->limit(8)->get();

        // Contexto legible sin exponer el snapshot completo: el frente o la unidad, el destino, el remito o el período
        $despues = $eventos->map(fn ($e) => (array) $e->after_json);
        $frentes = FrenteModel::whereIn('id_frente', $despues->pluck('id_frente')->filter()->unique())->pluck('nombre_frente', 'id_frente');
        $unidades = UnidadModel::whereIn('id_unidad', $despues->pluck('id_unidad')->filter()->unique())->pluck('nombre', 'id_unidad');
        $usuarios = UsuarioModel::whereIn('id_usuario', $eventos->pluck('id_usuario')->filter()->unique())->get()->keyBy('id_usuario');

        return response()->json(['data' => $eventos->map(function (AuditoriaEventoModel $e) use ($frentes, $unidades, $usuarios) {
            $a = (array) $e->after_json;
            $u = $usuarios->get($e->id_usuario);

            return [
                'id' => $e->id_evento,
                'accion' => $e->accion,
                'entidad_id' => $e->entidad_id,
                'fecha' => $e->created_at->format('Y-m-d H:i'),
                'usuario' => $u ? "{$u->nombre} {$u->apellido}" : 'Sistema',
                'contexto' => match (true) {
                    isset($a['id_unidad'], $unidades[$a['id_unidad']]) => $unidades[$a['id_unidad']],
                    isset($a['id_frente'], $frentes[$a['id_frente']]) => $frentes[$a['id_frente']],
                    isset($a['numero_remito']) => "Remito {$a['numero_remito']}",
                    isset($a['destino']) => $a['destino'],
                    isset($a['periodo']) => "Período {$a['periodo']}",
                    default => null,
                },
            ];
        })->values()]);
    }
}
