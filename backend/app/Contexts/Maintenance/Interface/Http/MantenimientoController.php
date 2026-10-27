<?php

namespace App\Contexts\Maintenance\Interface\Http;

use App\Contexts\ExternalCosts\Application\GestionIntegracion;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\Maintenance\Application\GestionMantenimiento;
use App\Contexts\Maintenance\Application\Ports\MantenimientoRepositorio;
use App\Contexts\Maintenance\Domain\EstadoMatafuego;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Shared\Application\RegistroIdempotente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Controller delgado de lecturas, fallas, matafuegos y panel técnico: valida, autoriza y delega. */
final class MantenimientoController
{
    private const RELACIONES = ['unidad.tipo', 'unidad.frente', 'operario', 'atendidoPor'];

    public function __construct(
        private readonly GestionMantenimiento $gestion,
        private readonly MantenimientoRepositorio $repo,
        private readonly RegistroIdempotente $idempotencia,
    ) {}

    /**
     * Para el aviso en tiempo real del formulario (RNF05): métrica y lecturas con valor vecinas a la fecha indicada
     * (por defecto, ahora). Con una carga atrasada, la referencia es la de esa fecha, no la última (D08, SDD spec 02).
     */
    public function ultimaLectura(Request $request, UnidadModel $unidad): JsonResponse
    {
        $f = $request->validate(['fecha' => ['nullable', 'date_format:Y-m-d\TH:i,Y-m-d H:i,Y-m-d H:i:s']]);
        $fecha = isset($f['fecha']) ? date('Y-m-d H:i:s', strtotime($f['fecha'])) : now()->format('Y-m-d H:i:s');
        // D28: la referencia solo se muestra a quien puede cargar sobre esa unidad en esa fecha
        abort_unless($this->repo->asignadoAUnidad($request->user()->id_usuario, $unidad->id_unidad, substr($fecha, 0, 10)), 403);
        $metrica = $unidad->load('tipo')->tipo->metrica;

        return response()->json(['data' => [
            'metrica' => $metrica->value,
            'anterior' => $this->repo->lecturaVecina($unidad->id_unidad, $metrica, $fecha, anterior: true),
            'posterior' => $this->repo->lecturaVecina($unidad->id_unidad, $metrica, $fecha, anterior: false),
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

        // Reintento desde el campo con la misma clave: devuelve la lectura ya registrada, sin duplicarla (D22)
        $r = $this->idempotencia->ejecutar($usuario, 'lectura', $request->header('Idempotency-Key'), $datos,
            fn () => $this->gestion->registrarLectura($datos, $usuario, now()->format('Y-m-d H:i:s')));
        $id = $r['id'];
        // RF12: exportación automática al terminar la respuesta, ya confirmada la lectura (ADR-004).
        // Si falla queda pendiente para el reintento; nunca revierte la lectura.
        app()->terminating(fn () => app(GestionIntegracion::class)->exportarLectura($id, now()->format('Y-m-d H:i:s')));

        return (new LecturaResource(LecturaModel::with(self::RELACIONES)->findOrFail($id)))->additional(['ya_registrado' => ! $r['nuevo']])->response()->setStatusCode($r['nuevo'] ? 201 : 200);
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
            // D24: obligatoriedad según el estado (ReglaMatafuego)
            'fecha_vencimiento_carga' => ['nullable', 'date_format:Y-m-d'],
            'etiqueta_ilegible' => ['sometimes', 'boolean'],
        ]);
        $datos = ['fecha_vencimiento_carga' => $datos['fecha_vencimiento_carga'] ?? null, 'etiqueta_ilegible' => (bool) ($datos['etiqueta_ilegible'] ?? false)] + $datos;
        $usuario = $request->user()->id_usuario;
        // Reintento tras un resultado incierto: misma clave, mismo control (D22)
        $r = $this->idempotencia->ejecutar($usuario, 'control', $request->header('Idempotency-Key'), $datos,
            fn () => $this->gestion->registrarControl($datos, $usuario, now()->toDateString()));

        return response()->json(['data' => $this->control(ControlMatafuegoModel::with(['unidad', 'operario'])->findOrFail($r['id'])), 'ya_registrado' => ! $r['nuevo']], $r['nuevo'] ? 201 : 200);
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
        // Último valor conocido: una carga de falla sin valor no lo pisa (SDD H-08.1)
        $valor = fn (string $col) => LecturaModel::select($col)->whereColumn('id_unidad', 'maquinaria.id_unidad')->whereNotNull($col)->orderByDesc('fecha_lectura')->orderByDesc('id_lectura')->limit(1);
        $fechaValor = LecturaModel::select('fecha_lectura')->whereColumn('id_unidad', 'maquinaria.id_unidad')
            ->where(fn ($q) => $q->whereNotNull('horometro_actual')->orWhereNotNull('kilometraje_actual'))->orderByDesc('fecha_lectura')->orderByDesc('id_lectura')->limit(1);
        $control = fn (string $col) => ControlMatafuegoModel::select($col)->whereColumn('id_unidad', 'maquinaria.id_unidad')->orderByDesc('fecha_revision')->orderByDesc('id_control')->limit(1);

        // shortcut: hasta 200 unidades en una página; paginar si la flota crece más
        $unidades = UnidadModel::query()->with(['tipo', 'frente'])->where('estado_activo', true)->orderBy('nombre')->limit(200)
            ->select('maquinaria.*')
            ->addSelect([
                'ultima_fecha' => $lectura('fecha_lectura'),
                'ultima_sin_valor' => LecturaModel::selectRaw('horometro_actual IS NULL AND kilometraje_actual IS NULL')->whereColumn('id_unidad', 'maquinaria.id_unidad')->orderByDesc('fecha_lectura')->orderByDesc('id_lectura')->limit(1),
                'valor_fecha' => $fechaValor,
                'ultimo_horometro' => $valor('horometro_actual'),
                'ultimo_km' => $valor('kilometraje_actual'),
                'fallas_abiertas' => LecturaModel::selectRaw('count(*)')->whereColumn('id_unidad', 'maquinaria.id_unidad')->where('tiene_falla', true)->whereNull('falla_atendida_at'),
                'matafuego_estado' => $control('estado_matafuego'),
                'matafuego_revision' => $control('fecha_revision'),
                'matafuego_vencimiento' => $control('fecha_vencimiento_carga'),
                'matafuego_ilegible' => $control('etiqueta_ilegible'),
            ])->get();

        return response()->json(['data' => $unidades->map(fn ($u) => [
            'unidad' => ['id' => $u->id_unidad, 'nombre' => $u->nombre, 'tipo' => $u->tipo->nombre, 'metrica' => $u->tipo->metrica->value, 'frente' => $u->frente?->nombre_frente],
            // ultima_lectura = último valor conocido; ultima_carga_sin_valor avisa si después hubo una falla sin lectura
            'ultima_lectura' => $u->valor_fecha ? ['fecha' => substr($u->valor_fecha, 0, 16), 'valor' => $u->ultimo_horometro ?? $u->ultimo_km] : null,
            'ultima_carga_sin_valor' => $u->ultima_fecha && $u->ultima_sin_valor ? substr($u->ultima_fecha, 0, 16) : null,
            'lectura_semana' => $u->ultima_fecha !== null && $u->ultima_fecha >= $lunes,
            'fallas_abiertas' => (int) $u->fallas_abiertas,
            'matafuego' => $u->matafuego_revision ? [
                'estado' => $u->matafuego_estado,
                'revision' => $u->matafuego_revision,
                'vencimiento' => $u->matafuego_vencimiento,
                'etiqueta_ilegible' => (bool) $u->matafuego_ilegible,
                'control_del_mes' => $u->matafuego_revision >= $inicioMes,
                // Sin vencimiento (falta el matafuego o etiqueta ilegible) no se calcula: en PHP null < 'fecha' daría true
                'vencido' => $u->matafuego_vencimiento !== null && $u->matafuego_vencimiento < $hoy,
                'por_vencer' => $u->matafuego_vencimiento !== null && $u->matafuego_vencimiento >= $hoy && $u->matafuego_vencimiento <= $en30,
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
            'fecha_vencimiento_carga' => $c->fecha_vencimiento_carga?->format('Y-m-d'),
            'etiqueta_ilegible' => $c->etiqueta_ilegible,
        ];
    }
}
