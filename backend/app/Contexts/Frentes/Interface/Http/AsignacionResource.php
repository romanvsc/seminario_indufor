<?php

namespace App\Contexts\Frentes\Interface\Http;

use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AsignacionModel */
final class AsignacionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_asignacion,
            'frente' => ['id' => $this->frente->id_frente, 'nombre' => $this->frente->nombre_frente],
            'usuario' => ['id' => $this->usuario->id_usuario, 'nombre' => $this->usuario->nombre, 'apellido' => $this->usuario->apellido],
            'fecha_desde' => $this->fecha_desde->format('Y-m-d'),
            'fecha_hasta' => $this->fecha_hasta?->format('Y-m-d'),
        ];
    }
}
