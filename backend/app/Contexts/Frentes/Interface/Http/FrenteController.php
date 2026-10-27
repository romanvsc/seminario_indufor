<?php

namespace App\Contexts\Frentes\Interface\Http;

use App\Contexts\Frentes\Application\GestionFrentes;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Permiso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Controller delgado de frentes y asignaciones: valida, autoriza (middleware can:) y delega en GestionFrentes. */
final class FrenteController
{
    public function __construct(private readonly GestionFrentes $gestion) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filtros = $request->validate([
            'estado' => ['nullable', Rule::in(['activos', 'inactivos', 'todos'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $query = FrenteModel::query()->orderBy('nombre_frente');
        match ($filtros['estado'] ?? 'activos') {
            'activos' => $query->where('estado_activo', true),
            'inactivos' => $query->where('estado_activo', false),
            'todos' => null,
        };

        return FrenteResource::collection($query->paginate($filtros['per_page'] ?? 20));
    }

    public function show(FrenteModel $frente): FrenteResource
    {
        return new FrenteResource($frente);
    }

    public function store(FrenteRequest $request): JsonResponse
    {
        $id = $this->gestion->crear($request->validated());

        return (new FrenteResource(FrenteModel::findOrFail($id)))->response()->setStatusCode(201);
    }

    public function update(FrenteRequest $request, FrenteModel $frente): FrenteResource
    {
        $this->gestion->actualizar($frente->id_frente, $request->validated());

        return new FrenteResource($frente->fresh());
    }

    public function deshabilitar(FrenteModel $frente): FrenteResource
    {
        $this->gestion->actualizar($frente->id_frente, ['estado_activo' => false]);

        return new FrenteResource($frente->fresh());
    }

    public function habilitar(FrenteModel $frente): FrenteResource
    {
        $this->gestion->actualizar($frente->id_frente, ['estado_activo' => true]);

        return new FrenteResource($frente->fresh());
    }

    public function asignaciones(Request $request): AnonymousResourceCollection
    {
        $filtros = $request->validate([
            'frente' => ['nullable', 'integer'],
            'usuario' => ['nullable', 'integer'],
            'vigentes' => ['nullable', 'boolean'],
            // Asignaciones vigentes en una fecha dada: el parte atrasado se valida contra esa fecha (D12, SDD spec 02)
            'fecha' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $dia = $filtros['fecha'] ?? ($request->boolean('vigentes') ? now()->toDateString() : null);
        // D29: el historial de otros solo lo ven quienes asignan o gestionan usuarios; el resto, solo lo propio
        if (! Gate::any([Permiso::FrontsAssignUsers->value, Permiso::UsersView->value])) {
            $propio = $request->user()->id_usuario;
            abort_if(isset($filtros['usuario']) && (int) $filtros['usuario'] !== $propio, 403);
            $filtros['usuario'] = $propio;
        }

        $query = AsignacionModel::query()->with(['frente', 'usuario'])
            ->when($filtros['frente'] ?? null, fn ($q, $id) => $q->where('id_frente', $id))
            ->when($filtros['usuario'] ?? null, fn ($q, $id) => $q->where('id_usuario', $id))
            ->when($dia, fn ($q) => $q->where('fecha_desde', '<=', $dia)
                ->where(fn ($w) => $w->whereNull('fecha_hasta')->orWhere('fecha_hasta', '>=', $dia)))
            ->orderByDesc('fecha_desde')->orderByDesc('id_asignacion');

        return AsignacionResource::collection($query->paginate($filtros['per_page'] ?? 20));
    }

    public function asignar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_frente' => ['required', 'integer', Rule::exists('frente_trabajo', 'id_frente')->where('estado_activo', true)],
            'id_usuario' => ['required', 'integer', Rule::exists('usuario', 'id_usuario')->where('estado_activo', true)],
            'fecha_desde' => ['required', 'date_format:Y-m-d'],
            'fecha_hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:fecha_desde'],
        ]);
        $id = $this->gestion->asignar($datos['id_frente'], $datos['id_usuario'], $datos['fecha_desde'], $datos['fecha_hasta'] ?? null);

        return (new AsignacionResource(AsignacionModel::with(['frente', 'usuario'])->findOrFail($id)))->response()->setStatusCode(201);
    }

    public function finalizar(Request $request, AsignacionModel $asignacion): AsignacionResource
    {
        $datos = $request->validate(['fecha_hasta' => ['required', 'date_format:Y-m-d']]);
        $this->gestion->finalizar($asignacion->id_asignacion, $datos['fecha_hasta']);

        return new AsignacionResource($asignacion->fresh()->load(['frente', 'usuario']));
    }
}
