<?php

namespace App\Contexts\IdentityAccess\Interface\Http;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UsuarioModel */
final class UsuarioResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_usuario,
            'nombre' => $this->nombre,
            'apellido' => $this->apellido,
            'email' => $this->email,
            'telefono_whatsapp' => $this->telefono_whatsapp,
            'estado_activo' => $this->estado_activo,
            'ultimo_acceso_at' => $this->ultimo_acceso_at?->toIso8601String(),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($r) => ['codigo' => $r->codigo, 'nombre' => $r->nombre])->values()),
            // Los permisos se envían solo para el propio usuario: la UI los usa para adaptar menús, nunca como seguridad
            'permisos' => $this->when($request->user()?->is($this->resource), fn () => $this->permisos()),
        ];
    }
}
