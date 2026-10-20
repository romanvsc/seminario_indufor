<?php

namespace App\Contexts\Logistics\Interface\Http;

use App\Contexts\Logistics\Infrastructure\SolicitudModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SolicitudModel */
final class SolicitudResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_solicitud,
            'estado' => $this->estado,
            'fecha_solicitud' => $this->fecha_solicitud->format('Y-m-d H:i'),
            'detalle' => $this->detalle_diferencias,
            'responsable' => $this->responsable ? ['id' => $this->responsable->id_usuario, 'nombre' => $this->responsable->nombre, 'apellido' => $this->responsable->apellido] : null,
            'fecha_resolucion' => $this->fecha_resolucion?->format('Y-m-d H:i'),
            'viaje' => new ViajeResource($this->viaje),
        ];
    }
}
