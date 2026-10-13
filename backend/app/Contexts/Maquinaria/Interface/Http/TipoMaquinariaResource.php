<?php

namespace App\Contexts\Maquinaria\Interface\Http;

use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TipoMaquinariaModel */
final class TipoMaquinariaResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_tipo_maquinaria,
            'nombre' => $this->nombre,
            'metrica' => $this->metrica->value,
            'estado_activo' => $this->estado_activo,
        ];
    }
}
