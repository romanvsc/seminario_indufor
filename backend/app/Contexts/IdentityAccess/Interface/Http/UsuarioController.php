<?php

namespace App\Contexts\IdentityAccess\Interface\Http;

use App\Contexts\IdentityAccess\Application\GestionUsuarios;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\RolModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Controller delgado: valida (FormRequest), autoriza (middleware can:), delega en GestionUsuarios. */
final class UsuarioController
{
    public function __construct(private readonly GestionUsuarios $gestion) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filtros = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', Rule::in(['activos', 'inactivos', 'todos'])],
            'rol' => ['nullable', Rule::enum(Rol::class)],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = UsuarioModel::query()->with('roles')->orderBy('apellido')->orderBy('nombre');
        if ($q = $filtros['q'] ?? null) {
            $query->where(fn ($w) => $w->where('nombre', 'like', "%{$q}%")->orWhere('apellido', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
        }
        match ($filtros['estado'] ?? 'activos') {
            'activos' => $query->where('estado_activo', true),
            'inactivos' => $query->where('estado_activo', false),
            'todos' => null,
        };
        if ($rol = $filtros['rol'] ?? null) {
            $query->whereHas('roles', fn ($r) => $r->where('codigo', $rol));
        }

        return UsuarioResource::collection($query->paginate($filtros['per_page'] ?? 20));
    }

    public function show(UsuarioModel $usuario): UsuarioResource
    {
        return new UsuarioResource($usuario->load('roles'));
    }

    public function store(UsuarioRequest $request): JsonResponse
    {
        $id = $this->gestion->crear($request->datosUsuario(), $request->validated('roles'));

        return (new UsuarioResource(UsuarioModel::with('roles')->findOrFail($id)))->response()->setStatusCode(201);
    }

    public function update(UsuarioRequest $request, UsuarioModel $usuario): UsuarioResource
    {
        $this->gestion->actualizar($usuario->id_usuario, $request->datosUsuario());

        return new UsuarioResource($usuario->fresh()->load('roles'));
    }

    public function roles(Request $request, UsuarioModel $usuario): UsuarioResource
    {
        $datos = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'distinct', Rule::enum(Rol::class)],
        ]);
        $this->gestion->asignarRoles($usuario->id_usuario, $datos['roles']);

        return new UsuarioResource($usuario->fresh()->load('roles'));
    }

    public function deshabilitar(Request $request, UsuarioModel $usuario): UsuarioResource
    {
        $this->gestion->cambiarEstado($usuario->id_usuario, false, $request->user()->id_usuario);

        return new UsuarioResource($usuario->fresh()->load('roles'));
    }

    public function habilitar(Request $request, UsuarioModel $usuario): UsuarioResource
    {
        $this->gestion->cambiarEstado($usuario->id_usuario, true, $request->user()->id_usuario);

        return new UsuarioResource($usuario->fresh()->load('roles'));
    }

    public function catalogoRoles(): JsonResponse
    {
        return response()->json(['data' => RolModel::where('estado_activo', true)->orderBy('id_rol')->get(['codigo', 'nombre', 'descripcion'])]);
    }
}
