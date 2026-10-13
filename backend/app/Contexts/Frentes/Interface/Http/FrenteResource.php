<?php

namespace App\Contexts\Frentes\Interface\Http;

use App\Contexts\Frentes\Infrastructure\FrenteModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FrenteModel */
final class FrenteResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_frente,
            'nombre' => $this->nombre_frente,
            'ubicacion' => $this->ubicacion_geografica,
            'modalidad' => $this->modalidad_produccion->value,
            'estado_activo' => $this->estado_activo,
        ];
    }
}
