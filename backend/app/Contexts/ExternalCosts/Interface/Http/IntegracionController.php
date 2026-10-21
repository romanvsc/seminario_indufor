<?php

namespace App\Contexts\ExternalCosts\Interface\Http;

use App\Contexts\ExternalCosts\Application\GestionIntegracion;
use App\Contexts\ExternalCosts\Application\Ports\IntegracionRepositorio;
use App\Contexts\ExternalCosts\Infrastructure\CodigoUnidad;
use App\Contexts\ExternalCosts\Infrastructure\ConsumoModel;
use App\Contexts\ExternalCosts\Infrastructure\LoteModel;
use App\Contexts\ExternalCosts\Infrastructure\SimuladorSistemaExterno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/** Controller delgado de intercambio con el sistema externo: valida, autoriza (middleware can:) y delega. */
final class IntegracionController
{
    public function __construct(
        private readonly GestionIntegracion $gestion,
        private readonly IntegracionRepositorio $repo,
    ) {}

    public function lotes(Request $request): JsonResponse
    {
        $f = $request->validate(['tipo' => ['nullable', Rule::in(['EXPORT_LECTURAS', 'IMPORT_CONSUMOS'])], 'estado' => ['nullable', 'string', 'max:30']]);
        $lotes = LoteModel::with('usuario')
            ->when($f['tipo'] ?? null, fn ($q, $v) => $q->where('tipo', $v))
            ->when($f['estado'] ?? null, fn ($q, $v) => $q->where('estado', $v))
            ->withCount('consumos')->orderByDesc('id_lote')->paginate(30);

        return response()->json([
            'data' => $lotes->getCollection()->map(fn (LoteModel $l) => $this->lote($l)),
            'meta' => ['current_page' => $lotes->currentPage(), 'last_page' => $lotes->lastPage(), 'per_page' => $lotes->perPage(), 'total' => $lotes->total()],
            'pendientes_exportacion' => count($this->repo->lecturasPendientes()),
        ]);
    }

    public function consumos(Request $request): JsonResponse
    {
        $periodo = $request->validate(['periodo' => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/']])['periodo'];
        $consumos = ConsumoModel::with('unidad')->where('periodo', $periodo)->orderBy('id_unidad')->get();

        return response()->json([
            'data' => $consumos->map(fn (ConsumoModel $c) => [
                'unidad' => ['id' => $c->unidad->id_unidad, 'nombre' => $c->unidad->nombre, 'codigo' => CodigoUnidad::de($c->unidad)],
                'litros' => $c->litros, 'costo_total' => $c->costo_total, 'referencia_externa' => $c->referencia_externa, 'id_lote' => $c->id_lote,
            ]),
            // Sumas en SQL sobre DECIMAL: el dinero nunca pasa por float
            'totales' => ConsumoModel::where('periodo', $periodo)->selectRaw('COALESCE(SUM(litros), 0) as litros, COALESCE(SUM(costo_total), 0) as costo_total')->first()->only(['litros', 'costo_total']),
        ]);
    }

    public function importar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'archivo' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'periodo' => ['required', 'string'],
            'reemplazar' => ['sometimes', 'boolean'],
            'motivo' => ['nullable', 'string', 'max:500'],
        ]);
        $archivo = $request->file('archivo');
        $r = $this->gestion->importar(
            (string) file_get_contents($archivo->getRealPath()), mb_substr($archivo->getClientOriginalName(), 0, 255), $datos['periodo'],
            $request->boolean('reemplazar'), $datos['motivo'] ?? null, $request->user()->id_usuario, now()->format('Y-m-d H:i:s'),
        );

        return response()->json(['data' => $this->lote(LoteModel::with('usuario')->withCount('consumos')->findOrFail($r['id_lote'])), 'ya_importado' => $r['ya_importado']], $r['ya_importado'] ? 200 : 201);
    }

    /** RF12: el envío es automático; esto solo reintenta lo que quedó pendiente (integration.export-readings). */
    public function reintentarExportacion(): JsonResponse
    {
        return response()->json(['data' => $this->gestion->exportarPendientes(now()->format('Y-m-d H:i:s'))]);
    }

    /** Archivo de prueba del simulador (ADR-004). No existe en producción. */
    public function simulador(Request $request): Response
    {
        abort_if(app()->isProduction(), 404);
        $periodo = $request->validate(['periodo' => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/']])['periodo'];

        return response(SimuladorSistemaExterno::consolidado($periodo), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"consumos-{$periodo}.csv\"",
        ]);
    }

    /** @return array<string, mixed> */
    private function lote(LoteModel $l): array
    {
        return [
            'id' => $l->id_lote,
            'tipo' => $l->tipo,
            'periodo' => $l->periodo,
            'nombre_archivo' => $l->nombre_archivo,
            'estado' => $l->estado,
            'usuario' => $l->usuario ? ['id' => $l->usuario->id_usuario, 'nombre' => $l->usuario->nombre, 'apellido' => $l->usuario->apellido] : null,
            'iniciado_at' => $l->iniciado_at->format('Y-m-d H:i'),
            'finalizado_at' => $l->finalizado_at?->format('Y-m-d H:i'),
            'consumos' => $l->consumos_count,
            'errores' => $l->tipo === 'IMPORT_CONSUMOS' && $l->detalle_error ? json_decode($l->detalle_error, true) : ($l->detalle_error ? [['fila' => null, 'mensaje' => $l->detalle_error]] : []),
        ];
    }
}
