<?php

namespace App\Contexts\Production\Interface\Http;

use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\Production\Application\GestionProduccion;
use App\Contexts\Production\Infrastructure\ProduccionModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use App\Contexts\Shared\Application\RegistroIdempotente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Controller delgado del parte diario: valida, autoriza y delega en GestionProduccion. */
final class ProduccionController
{
    private const RELACIONES = ['frente', 'unidad', 'tipo', 'registrante', 'operario'];

    public function __construct(
        private readonly GestionProduccion $gestion,
        private readonly RegistroIdempotente $idempotencia,
    ) {}

    public function tiposMadera(): JsonResponse
    {
        return response()->json(['data' => TipoMaderaModel::where('estado_activo', true)->orderBy('nombre')->get(['id_tipo_madera as id', 'nombre'])]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $verTodo = Gate::allows(Permiso::ProductionViewAll->value);
        Gate::authorize($verTodo ? Permiso::ProductionViewAll->value : Permiso::ProductionView->value);

        $f = $request->validate([
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'frente' => ['nullable', 'integer'],
            'unidad' => ['nullable', 'integer'],
            'tipo_madera' => ['nullable', 'integer'],
            'operario' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = ProduccionModel::query()->with(self::RELACIONES)
            ->when(! $verTodo, fn ($q) => $q->visiblesPara($request->user()->id_usuario))
            ->when($f['desde'] ?? null, fn ($q, $v) => $q->where('fecha_registro', '>=', $v))
            ->when($f['hasta'] ?? null, fn ($q, $v) => $q->where('fecha_registro', '<=', $v))
            ->when($f['frente'] ?? null, fn ($q, $v) => $q->where('id_frente', $v))
            ->when($f['unidad'] ?? null, fn ($q, $v) => $q->where('id_unidad', $v))
            ->when($f['tipo_madera'] ?? null, fn ($q, $v) => $q->where('tipo_madera', $v))
            ->when($f['operario'] ?? null, fn ($q, $v) => $q->where('id_operario', $v))
            ->orderByDesc('fecha_registro')->orderByDesc('id_produccion');

        return ProduccionResource::collection($query->paginate($f['per_page'] ?? 20));
    }

    public function show(Request $request, ProduccionModel $produccion): ProduccionResource
    {
        $this->autorizarLectura($request, $produccion);

        return new ProduccionResource($produccion->load(self::RELACIONES));
    }

    public function store(Request $request): JsonResponse
    {
        $usuario = $request->user()->id_usuario;
        $datos = $this->datos($request, true);
        // Reintento desde el campo con la misma clave: devuelve el parte ya creado, sin duplicarlo (D22)
        $r = $this->idempotencia->ejecutar($usuario, 'parte', $request->header('Idempotency-Key'), $datos,
            fn () => $this->gestion->registrar($datos, $usuario, $this->roles($request), $this->hoy()));

        return (new ProduccionResource(ProduccionModel::with(self::RELACIONES)->findOrFail($r['id'])))->additional(['ya_registrado' => ! $r['nuevo']])->response()->setStatusCode($r['nuevo'] ? 201 : 200);
    }

    public function update(Request $request, ProduccionModel $produccion): ProduccionResource
    {
        // production.update-own: solo quien registró el parte puede corregirlo
        Gate::authorize(Permiso::ProductionUpdateOwn->value);
        abort_unless($produccion->id_usuario === $request->user()->id_usuario, 403);

        // D25: la corrección exige motivo, que queda en la auditoría (como D19 en logística)
        $motivo = $request->validate(['motivo' => ['required', 'string', 'min:5', 'max:500']])['motivo'];
        $this->gestion->corregir($produccion->id_produccion, $this->datos($request, false), trim($motivo), $request->user()->id_usuario, $this->roles($request), $this->hoy());

        return new ProduccionResource($produccion->fresh()->load(self::RELACIONES));
    }

    public function subirFoto(Request $request, ProduccionModel $produccion): ProduccionResource
    {
        Gate::authorize(Permiso::ProductionUpdateOwn->value);
        abort_unless($produccion->id_usuario === $request->user()->id_usuario, 403);
        $request->validate(['foto' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192']]);

        // Disco privado: la foto solo se sirve por la API, con la misma autorización que el parte.
        // shortcut: si la transacción falla queda el archivo huérfano; limpiar con una tarea programada si aparece en producción
        $ruta = $request->file('foto')->store("produccion/{$produccion->id_produccion}", 'local');
        $this->gestion->adjuntarFoto($produccion->id_produccion, $ruta);

        return new ProduccionResource($produccion->fresh()->load(self::RELACIONES));
    }

    public function verFoto(Request $request, ProduccionModel $produccion): StreamedResponse
    {
        $this->autorizarLectura($request, $produccion);
        abort_if($produccion->foto_soporte === null || ! Storage::disk('local')->exists($produccion->foto_soporte), 404);

        return Storage::disk('local')->response($produccion->foto_soporte);
    }

    private function autorizarLectura(Request $request, ProduccionModel $p): void
    {
        if (Gate::allows(Permiso::ProductionViewAll->value)) {
            return;
        }
        Gate::authorize(Permiso::ProductionView->value);
        abort_unless(ProduccionModel::whereKey($p->id_produccion)->visiblesPara($request->user()->id_usuario)->exists(), 403);
    }

    /** @return array<string, mixed> */
    private function datos(Request $request, bool $alta): array
    {
        $req = $alta ? 'required' : 'sometimes';
        $datos = $request->validate([
            'id_frente' => [$req, 'integer'],
            'id_unidad' => [$req, 'integer', Rule::exists('maquinaria', 'id_unidad')->where('estado_activo', true)],
            'tipo_madera' => [$req, 'integer', Rule::exists('tipo_madera', 'id_tipo_madera')->where('estado_activo', true)],
            'fecha_registro' => [$req, 'date_format:Y-m-d'],
            'cantidad_toneladas' => ['nullable', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'metros_cubicos' => ['nullable', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'id_operario' => ['nullable', 'integer', Rule::exists('usuario', 'id_usuario')->where('estado_activo', true)],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);

        // En el alta, los campos opcionales ausentes valen null; en la corrección se conserva lo anterior
        return $alta ? $datos + array_fill_keys(['cantidad_toneladas', 'metros_cubicos', 'id_operario', 'observaciones'], null) : $datos;
    }

    /** @return list<string> */
    private function roles(Request $request): array
    {
        return $request->user()->roles()->pluck('codigo')->all();
    }

    private function hoy(): string
    {
        return now('America/Argentina/Buenos_Aires')->toDateString();
    }
}
