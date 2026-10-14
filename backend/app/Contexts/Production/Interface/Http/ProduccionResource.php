<?php

namespace App\Contexts\Production\Interface\Http;

use App\Contexts\Production\Infrastructure\ProduccionModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProduccionModel */
final class ProduccionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $persona = fn ($u) => $u ? ['id' => $u->id_usuario, 'nombre' => $u->nombre, 'apellido' => $u->apellido] : null;

        return [
            'id' => $this->id_produccion,
            'fecha_registro' => $this->fecha_registro->format('Y-m-d'),
            'frente' => ['id' => $this->frente->id_frente, 'nombre' => $this->frente->nombre_frente, 'modalidad' => $this->frente->modalidad_produccion->value],
            'unidad' => ['id' => $this->unidad->id_unidad, 'nombre' => $this->unidad->nombre],
            'tipo_madera' => ['id' => $this->tipo->id_tipo_madera, 'nombre' => $this->tipo->nombre],
            'cantidad_toneladas' => $this->cantidad_toneladas,
            'metros_cubicos' => $this->metros_cubicos,
            'registrado_por' => $persona($this->registrante),
            'operario' => $persona($this->operario),
            'tiene_foto' => $this->foto_soporte !== null,
            'observaciones' => $this->observaciones,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
