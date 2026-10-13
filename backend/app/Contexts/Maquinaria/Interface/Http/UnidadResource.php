<?php

namespace App\Contexts\Maquinaria\Interface\Http;

use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UnidadModel */
final class UnidadResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_unidad,
            'nombre' => $this->nombre,
            'dominio_patente' => $this->dominio_patente,
            'marca_modelo' => $this->marca_modelo,
            'estado_activo' => $this->estado_activo,
            'tipo' => ['id' => $this->tipo->id_tipo_maquinaria, 'nombre' => $this->tipo->nombre, 'metrica' => $this->tipo->metrica->value],
            'frente' => $this->frente ? ['id' => $this->frente->id_frente, 'nombre' => $this->frente->nombre_frente] : null,
            'usuario' => $this->usuario ? ['id' => $this->usuario->id_usuario, 'nombre' => $this->usuario->nombre, 'apellido' => $this->usuario->apellido] : null,
        ];
    }
}
