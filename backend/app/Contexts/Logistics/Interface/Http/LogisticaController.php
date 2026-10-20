<?php

namespace App\Contexts\Logistics\Interface\Http;

use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\Logistics\Application\GestionLogistica;
use App\Contexts\Logistics\Domain\EstadoViaje;
use App\Contexts\Logistics\Infrastructure\SolicitudModel;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Controller delgado de viajes, remitos y correcciones: valida, autoriza y delega en GestionLogistica. */
final class LogisticaController
{
    private const RELACIONES = ['camion', 'camionero', 'origen', 'tipo', 'remito.transportista', 'remito.tipo', 'solicitudes'];

    public function __construct(private readonly GestionLogistica $gestion) {}

    public function viajes(Request $request): AnonymousResourceCollection
    {
        $verTodo = Gate::allows(Permiso::TripViewAll->value);
        Gate::authorize($verTodo ? Permiso::TripViewAll->value : Permiso::TripViewOwn->value);

        $f = $request->validate([
            'estado' => ['nullable', Rule::enum(EstadoViaje::class)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'origen' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $query = ViajeModel::query()->with(self::RELACIONES)
            ->when(! $verTodo, fn ($q) => $q->where('id_usuario_camionero', $request->user()->id_usuario))
            ->when($f['estado'] ?? null, fn ($q, $v) => $q->where('estado_validacion', $v))
            ->when($f['desde'] ?? null, fn ($q, $v) => $q->whereDate('fecha', '>=', $v))
            ->when($f['hasta'] ?? null, fn ($q, $v) => $q->whereDate('fecha', '<=', $v))
            ->when($f['origen'] ?? null, fn ($q, $v) => $q->where('id_frente_origen', $v))
            ->orderByDesc('fecha')->orderByDesc('id_viaje');

        return ViajeResource::collection($query->paginate($f['per_page'] ?? 20));
    }

    public function viaje(Request $request, ViajeModel $viaje): ViajeResource
    {
        if (! Gate::allows(Permiso::TripViewAll->value)) {
            Gate::authorize(Permiso::TripViewOwn->value);
            abort_unless($viaje->id_usuario_camionero === $request->user()->id_usuario, 403);
        }

        return new ViajeResource($viaje->load(self::RELACIONES));
    }

    public function declarar(Request $request): JsonResponse
    {
        $usuario = $request->user()->id_usuario;
        // Reintento desde el campo con la misma clave: se devuelve el viaje ya declarado, sin duplicarlo
        $clave = $request->header('Idempotency-Key');
        $cache = $clave ? "idem:trip:{$usuario}:".mb_substr($clave, 0, 64) : null;
        if ($cache && ($existente = Cache::get($cache))) {
            return (new ViajeResource(ViajeModel::with(self::RELACIONES)->findOrFail($existente)))->response()->setStatusCode(200);
        }

        $datos = $request->validate([
            'id_unidad_camion' => ['required', 'integer', Rule::exists('maquinaria', 'id_unidad')->where('estado_activo', true)],
            'id_frente_origen' => ['required', 'integer'],
            'fecha' => ['required', 'date_format:Y-m-d\TH:i,Y-m-d H:i,Y-m-d H:i:s'],
            'destino' => ['required', 'string', 'max:150'],
            'tipo_madera' => ['required', 'integer', Rule::exists('tipo_madera', 'id_tipo_madera')->where('estado_activo', true)],
            'volumen_declarado' => ['required', 'numeric', 'gt:0', 'max:99999999.99', 'decimal:0,2'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);
        $datos['fecha'] = date('Y-m-d H:i:s', strtotime($datos['fecha']));
        $datos['volumen_declarado'] = $this->toneladas($datos['volumen_declarado']);

        // shortcut: dos envíos simultáneos con la misma clave pueden pasar ambos; agregar Cache::lock si se observa en producción
        $id = $this->gestion->declarar($datos + ['observaciones' => null], $usuario, now()->format('Y-m-d H:i:s'));
        if ($cache) {
            Cache::put($cache, $id, now()->addDay());
        }

        return (new ViajeResource(ViajeModel::with(self::RELACIONES)->findOrFail($id)))->response()->setStatusCode(201);
    }

    public function cargarRemito(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'numero_remito' => ['required', 'string', 'max:50'],
            'id_viaje' => ['required', 'integer'],
            'fecha_remito' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'id_transportista' => ['required', 'integer', Rule::exists('usuario', 'id_usuario')],
            'tipo_madera_remito' => ['required', 'integer', Rule::exists('tipo_madera', 'id_tipo_madera')],
            'volumen_toneladas_remito' => ['required', 'numeric', 'gt:0', 'max:99999999.99', 'decimal:0,2'],
        ]);
        $datos['numero_remito'] = trim($datos['numero_remito']);
        $datos['volumen_toneladas_remito'] = $this->toneladas($datos['volumen_toneladas_remito']);

        $diferencias = $this->gestion->cargarRemito($datos, now()->format('Y-m-d H:i:s'));

        return (new ViajeResource(ViajeModel::with(self::RELACIONES)->findOrFail($datos['id_viaje'])))
            ->additional(['cotejo' => ['coincide' => $diferencias === [], 'diferencias' => $diferencias]])
            ->response()->setStatusCode(201);
    }

    public function solicitudes(Request $request): AnonymousResourceCollection
    {
        $f = $request->validate(['estado' => ['nullable', Rule::in(['PENDIENTE', 'EN_REVISION', 'RESUELTA', 'ABIERTAS'])]]);
        $estado = $f['estado'] ?? 'ABIERTAS';
        $query = SolicitudModel::query()->with(['responsable', ...array_map(fn ($r) => "viaje.{$r}", self::RELACIONES)])
            ->when($estado === 'ABIERTAS', fn ($q) => $q->where('estado', '!=', 'RESUELTA'), fn ($q) => $q->where('estado', $estado))
            ->orderBy('fecha_solicitud');

        return SolicitudResource::collection($query->paginate(50));
    }

    public function tomar(Request $request, SolicitudModel $solicitud): SolicitudResource
    {
        $this->gestion->tomarSolicitud($solicitud->id_solicitud, $request->user()->id_usuario);

        return new SolicitudResource($solicitud->fresh()->load(['responsable', ...array_map(fn ($r) => "viaje.{$r}", self::RELACIONES)]));
    }

    public function resolver(Request $request, SolicitudModel $solicitud): JsonResponse
    {
        $datos = $request->validate([
            'motivo' => ['required', 'string', 'min:5', 'max:500'],
            'viaje' => ['array'],
            'viaje.volumen_declarado' => ['sometimes', 'numeric', 'gt:0', 'max:99999999.99', 'decimal:0,2'],
            'viaje.tipo_madera' => ['sometimes', 'integer', Rule::exists('tipo_madera', 'id_tipo_madera')],
            'remito' => ['array'],
            'remito.volumen_toneladas_remito' => ['sometimes', 'numeric', 'gt:0', 'max:99999999.99', 'decimal:0,2'],
            'remito.tipo_madera_remito' => ['sometimes', 'integer', Rule::exists('tipo_madera', 'id_tipo_madera')],
            'remito.id_transportista' => ['sometimes', 'integer', Rule::exists('usuario', 'id_usuario')],
        ]);
        $viaje = $datos['viaje'] ?? [];
        $remito = $datos['remito'] ?? [];
        if (isset($viaje['volumen_declarado'])) {
            $viaje['volumen_declarado'] = $this->toneladas($viaje['volumen_declarado']);
        }
        if (isset($remito['volumen_toneladas_remito'])) {
            $remito['volumen_toneladas_remito'] = $this->toneladas($remito['volumen_toneladas_remito']);
        }

        $diferencias = $this->gestion->corregir($solicitud->id_solicitud, $viaje, $remito, trim($datos['motivo']), $request->user()->id_usuario, now()->format('Y-m-d H:i:s'));

        return (new ViajeResource(ViajeModel::with(self::RELACIONES)->findOrFail($solicitud->id_viaje)))
            ->additional(['cotejo' => ['coincide' => $diferencias === [], 'diferencias' => $diferencias]])
            ->response();
    }

    /** Toneladas a 2 decimales en texto (D06): así un "12.5" del formulario no figura como cambio frente a "12.50". */
    private function toneladas(mixed $valor): string
    {
        return number_format((float) $valor, 2, '.', '');
    }
}
