<?php

namespace App\Contexts\Logistics\Interface\Http;

use App\Contexts\Logistics\Infrastructure\ViajeModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ViajeModel */
final class ViajeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $persona = fn ($u) => ['id' => $u->id_usuario, 'nombre' => $u->nombre, 'apellido' => $u->apellido];
        $remito = $this->remito;
        $abierta = $this->solicitudes->first(fn ($s) => $s->estado !== 'RESUELTA');

        return [
            'id' => $this->id_viaje,
            'fecha' => $this->fecha->format('Y-m-d H:i'),
            'estado' => $this->estado_validacion,
            'origen' => ['id' => $this->origen->id_frente, 'nombre' => $this->origen->nombre_frente],
            'destino' => $this->destino,
            'camion' => ['id' => $this->camion->id_unidad, 'nombre' => $this->camion->nombre, 'dominio_patente' => $this->camion->dominio_patente],
            'camionero' => $persona($this->camionero),
            'tipo_madera' => ['id' => $this->tipo->id_tipo_madera, 'nombre' => $this->tipo->nombre],
            'volumen_declarado' => $this->volumen_declarado,
            'observaciones' => $this->observaciones,
            'remito' => $remito ? [
                'numero' => $remito->numero_remito,
                'fecha' => $remito->fecha_remito->format('Y-m-d'),
                'transportista' => $persona($remito->transportista),
                'tipo_madera' => ['id' => $remito->tipo->id_tipo_madera, 'nombre' => $remito->tipo->nombre],
                'volumen_toneladas' => $remito->volumen_toneladas_remito,
            ] : null,
            'solicitud_abierta' => $abierta ? ['id' => $abierta->id_solicitud, 'estado' => $abierta->estado, 'detalle' => $abierta->detalle_diferencias] : null,
        ];
    }
}
