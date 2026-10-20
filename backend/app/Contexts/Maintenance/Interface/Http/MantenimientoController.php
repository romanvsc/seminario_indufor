<?php

namespace App\Contexts\Maintenance\Interface\Http;

use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\Maintenance\Application\GestionMantenimiento;
use App\Contexts\Maintenance\Application\Ports\MantenimientoRepositorio;
use App\Contexts\Maintenance\Domain\EstadoMatafuego;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Controller delgado de lecturas, fallas, matafuegos y panel técnico: valida, autoriza y delega. */
final class MantenimientoController
{
    private const RELACIONES = ['unidad.tipo', 'unidad.frente', 'operario', 'atendidoPor'];

    public function __construct(
        private readonly GestionMantenimiento $gestion,
        private readonly MantenimientoRepositorio $repo,
    ) {}

    /** Para el aviso en tiempo real del formulario (RNF05): métrica de la unidad y última lectura con valor. */
    public function ultimaLectura(UnidadModel $unidad): JsonResponse
    {
        $metrica = $unidad->load('tipo')->tipo->metrica;

        return response()->json(['data' => [
            'metrica' => $metrica->value,
            'anterior' => $this->repo->lecturaVecina($unidad->id_unidad, $metrica, now()->format('Y-m-d H:i:s'), anterior: true),
        ]]);
    }

    public function lecturas(Request $request): AnonymousResourceCollection
    {
        $f = $request->validate([
            'unidad' => ['nullable', 'integer'],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $todo = Gate::allows(Permiso::FailureView->value); // Administración, Gerencia y Mantenimiento ven todas (D20)
        $query = LecturaModel::query()->with(self::RELACIONES)
            ->when(! $todo, fn ($q) => $q->visiblesPara($request->user()->id_usuario, now()->toDateString()))
            ->when($f['unidad'] ?? null, fn ($q, $v) => $q->where('id_unidad', $v))
            ->when($f['desde'] ?? null, fn ($q, $v) => $q->whereDate('fecha_lectura', '>=', $v))
            ->when($f['hasta'] ?? null, fn ($q, $v) => $q->whereDate('fecha_lectura', '<=', $v))
            ->orderByDesc('fecha_lectura')->orderByDesc('id_lectura');

        return LecturaResource::collection($query->paginate($f['per_page'] ?? 20));
    }

    public function registrarLectura(Request $request): JsonResponse
    {
        $usuario = $request->user()->id_usuario;
        $clave = $request->header('Idempotency-Key');
        $cache = $clave ? "idem:reading:{$usuario}:".mb_substr($clave, 0, 64) : null;
        if ($cache && ($existente = Cache::get($cache))) {
            return (new LecturaResource(LecturaModel::with(self::RELACIONES)->findOrFail($existente)))->response()->setStatusCode(200);
        }

        $datos = $request->validate([
            'id_unidad' => ['required', 'integer'],
            'fecha_lectura' => ['required', 'date_format:Y-m-d\TH:i,Y-m-d H:i,Y-m-d H:i:s'],
            'horometro_actual' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99', 'decimal:0,2'],
            'kilometraje_actual' => ['nullable', 'integer', 'min:0', 'max:4294967295'],
            'tiene_falla' => ['required', 'boolean'],
            'detalle_falla' => ['nullable', 'string', 'max:2000'],
        ]);
        $datos = [
            'id_unidad' => (int) $datos['id_unidad'],
            'fecha_lectura' => date('Y-m-d H:i:s', strtotime($datos['fecha_lectura'])),
            'horometro_actual' => isset($datos['horometro_actual']) ? number_format((float) $datos['horometro_actual'], 2, '.', '') : null,
            'kilometraje_actual' => isset($datos['kilometraje_actual']) ? (string) $datos['kilometraje_actual'] : null,
            'tiene_falla' => (bool) $datos['tiene_falla'],
            'detalle_falla' => $datos['detalle_falla'] ?? null,
        ];

        // shortcut: dos envíos simultáneos con la misma clave pueden pasar ambos; agregar Cache::lock si se observa en producción
        $id = $this->gestion->registrarLectura($datos, $usuario, now()->format('Y-m-d H:i:s'));
        if ($cache) {
            Cache::put($cache, $id, now()->addDay());
        }

        return (new LecturaResource(LecturaModel::with(self::RELACIONES)->findOrFail($id)))->response()->setStatusCode(201);
    }

    public function fallas(Request $request): AnonymousResourceCollection
    {
        $estado = $request->validate(['estado' => ['nullable', Rule::in(['abiertas', 'atendidas'])]])['estado'] ?? 'abiertas';
        $query = LecturaModel::query()->with(self::RELACIONES)->where('tiene_falla', true)
            ->when($estado === 'abiertas', fn ($q) => $q->whereNull('falla_atendida_at'), fn ($q) => $q->whereNotNull('falla_atendida_at'))
            ->orderBy($estado === 'abiertas' ? 'fecha_lectura' : 'falla_atendida_at', $estado === 'abiertas' ? 'asc' : 'desc');

        return LecturaResource::collection($query->paginate(50));
    }

    public function atenderFalla(Request $request, LecturaModel $lectura): LecturaResource
    {
        $nota = $request->validate(['nota' => ['required', 'string', 'min:3', 'max:1000']])['nota'];
        $this->gestion->atenderFalla($lectura->id_lectura, trim($nota), $request->user()->id_usuario, now()->format('Y-m-d H:i:s'));

        return new LecturaResource($lectura->fresh()->load(self::RELACIONES));
    }

    public function matafuegos(Request $request): JsonResponse
    {
        $f = $request->validate(['unidad' => ['nullable', 'integer']]);
        $controles = ControlMatafuegoModel::with(['unidad', 'operario'])
            ->when($f['unidad'] ?? null, fn ($q, $v) => $q->where('id_unidad', $v))
            ->orderByDesc('fecha_revision')->orderByDesc('id_control')->paginate(50);

        return response()->json($controles->through(fn (ControlMatafuegoModel $c) => $this->control($c)));
    }

    public function registrarMatafuego(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_unidad' => ['required', 'integer'],
            'estado_matafuego' => ['required', Rule::enum(EstadoMatafuego::class)],
            'fecha_revision' => ['required', 'date_format:Y-m-d'],
            'fecha_vencimiento_carga' => ['required', 'date_format:Y-m-d'],
        ]);
        $id = $this->gestion->registrarControl($datos, $request->user()->id_usuario, now()->toDateString());

        return response()->json(['data' => $this->control(ControlMatafuegoModel::with(['unidad', 'operario'])->findOrFail($id))], 201);
    }

    /**
     * Panel técnico: por unidad activa, última lectura, si tiene lectura desde el lunes (corte semanal RF09),
     * fallas abiertas y último control de matafuego con su vencimiento.
     */
    public function panel(): JsonResponse
    {
        $lunes = now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d H:i:s');
        $inicioMes = now()->startOfMonth()->toDateString();
        $hoy = now()->toDateString();
        $en30 = now()->addDays(30)->toDateString();
        $lectura = fn (string $col) => LecturaModel::select($col)->whereColumn('id_unidad', 'maquinaria.id_unidad')->orderByDesc('fecha_lectura')->orderByDesc('id_lectura')->limit(1);
        $control = fn (string $col) => ControlMatafuegoModel::select($col)->whereColumn('id_unidad', 'maquinaria.id_unidad')->orderByDesc('fecha_revision')->orderByDesc('id_control')->limit(1);

        // shortcut: hasta 200 unidades en una página; paginar si la flota crece más
        $unidades = UnidadModel::query()->with(['tipo', 'frente'])->where('estado_activo', true)->orderBy('nombre')->limit(200)
            ->select('maquinaria.*')
            ->addSelect([
                'ultima_fecha' => $lectura('fecha_lectura'),
                'ultimo_horometro' => $lectura('horometro_actual'),
                'ultimo_km' => $lectura('kilometraje_actual'),
                'fallas_abiertas' => LecturaModel::selectRaw('count(*)')->whereColumn('id_unidad', 'maquinaria.id_unidad')->where('tiene_falla', true)->whereNull('falla_atendida_at'),
                'matafuego_estado' => $control('estado_matafuego'),
                'matafuego_revision' => $control('fecha_revision'),
                'matafuego_vencimiento' => $control('fecha_vencimiento_carga'),
            ])->get();

        return response()->json(['data' => $unidades->map(fn ($u) => [
            'unidad' => ['id' => $u->id_unidad, 'nombre' => $u->nombre, 'tipo' => $u->tipo->nombre, 'metrica' => $u->tipo->metrica->value, 'frente' => $u->frente?->nombre_frente],
            'ultima_lectura' => $u->ultima_fecha ? ['fecha' => substr($u->ultima_fecha, 0, 16), 'valor' => $u->ultimo_horometro ?? $u->ultimo_km] : null,
            'lectura_semana' => $u->ultima_fecha !== null && $u->ultima_fecha >= $lunes,
            'fallas_abiertas' => (int) $u->fallas_abiertas,
            'matafuego' => $u->matafuego_revision ? [
                'estado' => $u->matafuego_estado,
                'revision' => $u->matafuego_revision,
                'vencimiento' => $u->matafuego_vencimiento,
                'control_del_mes' => $u->matafuego_revision >= $inicioMes,
                'vencido' => $u->matafuego_vencimiento < $hoy,
                'por_vencer' => $u->matafuego_vencimiento >= $hoy && $u->matafuego_vencimiento <= $en30,
            ] : null,
        ])]);
    }

    /** @return array<string, mixed> */
    private function control(ControlMatafuegoModel $c): array
    {
        return [
            'id' => $c->id_control,
            'unidad' => ['id' => $c->unidad->id_unidad, 'nombre' => $c->unidad->nombre],
            'operario' => ['id' => $c->operario->id_usuario, 'nombre' => $c->operario->nombre, 'apellido' => $c->operario->apellido],
            'estado' => $c->estado_matafuego,
            'fecha_revision' => $c->fecha_revision->format('Y-m-d'),
            'fecha_vencimiento_carga' => $c->fecha_vencimiento_carga->format('Y-m-d'),
        ];
    }
}
