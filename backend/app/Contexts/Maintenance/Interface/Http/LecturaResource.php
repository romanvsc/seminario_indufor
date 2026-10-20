<?php

namespace App\Contexts\Maintenance\Interface\Http;

use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LecturaModel */
final class LecturaResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $persona = fn ($u) => $u ? ['id' => $u->id_usuario, 'nombre' => $u->nombre, 'apellido' => $u->apellido] : null;

        return [
            'id' => $this->id_lectura,
            'fecha_lectura' => $this->fecha_lectura->format('Y-m-d H:i'),
            'unidad' => ['id' => $this->unidad->id_unidad, 'nombre' => $this->unidad->nombre, 'metrica' => $this->unidad->tipo->metrica->value, 'frente' => $this->unidad->frente?->nombre_frente],
            'horometro_actual' => $this->horometro_actual,
            'kilometraje_actual' => $this->kilometraje_actual,
            'operario' => $persona($this->operario),
            'tiene_falla' => $this->tiene_falla,
            'detalle_falla' => $this->detalle_falla,
            'atencion' => $this->falla_atendida_at ? [
                'fecha' => $this->falla_atendida_at->format('Y-m-d H:i'),
                'por' => $persona($this->atendidoPor),
                'nota' => $this->nota_atencion,
            ] : null,
        ];
    }
}
