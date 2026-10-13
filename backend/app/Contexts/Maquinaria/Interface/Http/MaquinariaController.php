<?php

namespace App\Contexts\Maquinaria\Interface\Http;

use App\Contexts\Maquinaria\Application\GestionMaquinaria;
use App\Contexts\Maquinaria\Domain\Metrica;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Controller delgado de tipos de maquinaria y unidades: valida, autoriza (middleware can:) y delega. */
final class MaquinariaController
{
    private const RELACIONES = ['tipo', 'frente', 'usuario'];

    public function __construct(private readonly GestionMaquinaria $gestion) {}

    public function tipos(Request $request): AnonymousResourceCollection
    {
        $query = TipoMaquinariaModel::query()->orderBy('nombre');
        $this->filtrarEstado($request, $query);

        return TipoMaquinariaResource::collection($query->paginate(100));
    }

    public function crearTipo(Request $request): JsonResponse
    {
        $id = $this->gestion->crear(GestionMaquinaria::TIPO, $this->validarTipo($request));

        return (new TipoMaquinariaResource(TipoMaquinariaModel::findOrFail($id)))->response()->setStatusCode(201);
    }

    public function actualizarTipo(Request $request, TipoMaquinariaModel $tipo): TipoMaquinariaResource
    {
        $this->gestion->actualizar(GestionMaquinaria::TIPO, $tipo->id_tipo_maquinaria, $this->validarTipo($request, $tipo->id_tipo_maquinaria));

        return new TipoMaquinariaResource($tipo->fresh());
    }

    public function estadoTipo(Request $request, TipoMaquinariaModel $tipo): TipoMaquinariaResource
    {
        $this->gestion->actualizar(GestionMaquinaria::TIPO, $tipo->id_tipo_maquinaria, ['estado_activo' => $request->routeIs('*.enable')]);

        return new TipoMaquinariaResource($tipo->fresh());
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $filtros = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'tipo' => ['nullable', 'integer'],
            'frente' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $query = UnidadModel::query()->with(self::RELACIONES)->orderBy('nombre')
            ->when($filtros['q'] ?? null, fn ($q, $t) => $q->where(fn ($w) => $w->where('nombre', 'like', "%{$t}%")->orWhere('dominio_patente', 'like', "%{$t}%")))
            ->when($filtros['tipo'] ?? null, fn ($q, $id) => $q->where('id_tipo_maquinaria', $id))
            ->when($filtros['frente'] ?? null, fn ($q, $id) => $q->where('id_frente_actual', $id));
        $this->filtrarEstado($request, $query);

        return UnidadResource::collection($query->paginate($filtros['per_page'] ?? 20));
    }

    public function show(UnidadModel $unidad): UnidadResource
    {
        return new UnidadResource($unidad->load(self::RELACIONES));
    }

    public function store(Request $request): JsonResponse
    {
        $id = $this->gestion->crear(GestionMaquinaria::UNIDAD, $this->validarUnidad($request));

        return (new UnidadResource(UnidadModel::with(self::RELACIONES)->findOrFail($id)))->response()->setStatusCode(201);
    }

    public function update(Request $request, UnidadModel $unidad): UnidadResource
    {
        $this->gestion->actualizar(GestionMaquinaria::UNIDAD, $unidad->id_unidad, $this->validarUnidad($request, $unidad->id_unidad));

        return new UnidadResource($unidad->fresh()->load(self::RELACIONES));
    }

    public function estado(Request $request, UnidadModel $unidad): UnidadResource
    {
        $this->gestion->actualizar(GestionMaquinaria::UNIDAD, $unidad->id_unidad, ['estado_activo' => $request->routeIs('*.enable')]);

        return new UnidadResource($unidad->fresh()->load(self::RELACIONES));
    }

    private function filtrarEstado(Request $request, Builder $query): void
    {
        $estado = $request->validate(['estado' => ['nullable', Rule::in(['activos', 'inactivos', 'todos'])]])['estado'] ?? 'activos';
        if ($estado !== 'todos') {
            $query->where('estado_activo', $estado === 'activos');
        }
    }

    /** @return array<string, mixed> */
    private function validarTipo(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:80', Rule::unique('tipo_maquinaria', 'nombre')->ignore($id, 'id_tipo_maquinaria')],
            'metrica' => ['required', Rule::enum(Metrica::class)],
        ]);
    }

    /** @return array<string, mixed> */
    private function validarUnidad(Request $request, ?int $id = null): array
    {
        if ($request->filled('dominio_patente')) {
            $request->merge(['dominio_patente' => mb_strtoupper(preg_replace('/\s+/', '', (string) $request->input('dominio_patente')))]);
        }

        return $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'dominio_patente' => ['nullable', 'string', 'max:20', Rule::unique('maquinaria', 'dominio_patente')->ignore($id, 'id_unidad')],
            'marca_modelo' => ['required', 'string', 'max:120'],
            'id_tipo_maquinaria' => ['required', 'integer', Rule::exists('tipo_maquinaria', 'id_tipo_maquinaria')->where('estado_activo', true)],
            'id_frente_actual' => ['nullable', 'integer', Rule::exists('frente_trabajo', 'id_frente')->where('estado_activo', true)],
            'id_usuario' => ['nullable', 'integer', Rule::exists('usuario', 'id_usuario')->where('estado_activo', true)],
        ]);
    }
}
