<?php

namespace App\Contexts\Logistics\Infrastructure;

use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Logistics\Application\Ports\LogisticaRepositorio;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;

final class LogisticaRepositorioEloquent implements LogisticaRepositorio
{
    public function nombreFrenteActivo(int $idFrente): ?string
    {
        return FrenteModel::where('estado_activo', true)->find($idFrente)?->nombre_frente;
    }

    public function crearViaje(array $datos): int
    {
        return ViajeModel::create($datos)->id_viaje;
    }

    public function viaje(int $idViaje, bool $bloquear = false): ?array
    {
        $v = ViajeModel::query()->when($bloquear, fn ($q) => $q->lockForUpdate())->find($idViaje);

        return $v === null ? null : [
            'id_viaje' => $v->id_viaje,
            'id_unidad_camion' => $v->id_unidad_camion,
            'id_usuario_camionero' => $v->id_usuario_camionero,
            'id_frente_origen' => $v->id_frente_origen,
            'fecha' => $v->fecha->format('Y-m-d H:i:s'),
            'destino' => $v->destino,
            'tipo_madera' => $v->tipo_madera,
            'volumen_declarado' => $v->volumen_declarado,
            'observaciones' => $v->observaciones,
            'estado_validacion' => $v->estado_validacion,
        ];
    }

    public function actualizarViaje(int $idViaje, array $datos): void
    {
        ViajeModel::findOrFail($idViaje)->update($datos);
    }

    public function crearRemito(array $datos): void
    {
        RemitoModel::create($datos);
    }

    public function remitoDeViaje(int $idViaje): ?array
    {
        $r = RemitoModel::where('id_viaje', $idViaje)->first();

        return $r === null ? null : [
            'numero_remito' => $r->numero_remito,
            'id_viaje' => $r->id_viaje,
            'fecha_remito' => $r->fecha_remito->format('Y-m-d'),
            'id_transportista' => $r->id_transportista,
            'tipo_madera_remito' => $r->tipo_madera_remito,
            'volumen_toneladas_remito' => $r->volumen_toneladas_remito,
            'fecha_recepcion_admin' => $r->fecha_recepcion_admin->format('Y-m-d H:i:s'),
        ];
    }

    public function actualizarRemito(string $numero, array $datos): void
    {
        RemitoModel::findOrFail($numero)->update($datos);
    }

    public function existeRemito(string $numero): bool
    {
        return RemitoModel::whereKey($numero)->exists();
    }

    public function crearSolicitud(int $idViaje, string $detalle): int
    {
        return SolicitudModel::create(['id_viaje' => $idViaje, 'fecha_solicitud' => now(), 'detalle_diferencias' => $detalle, 'estado' => 'PENDIENTE'])->id_solicitud;
    }

    public function solicitud(int $idSolicitud, bool $bloquear = false): ?array
    {
        $s = SolicitudModel::query()->when($bloquear, fn ($q) => $q->lockForUpdate())->find($idSolicitud);

        return $s === null ? null : [
            'id_solicitud' => $s->id_solicitud,
            'id_viaje' => $s->id_viaje,
            'detalle_diferencias' => $s->detalle_diferencias,
            'estado' => $s->estado,
            'fecha_resolucion' => $s->fecha_resolucion?->format('Y-m-d H:i:s'),
            'id_usuario_responsable' => $s->id_usuario_responsable,
        ];
    }

    public function actualizarSolicitud(int $idSolicitud, array $datos): void
    {
        SolicitudModel::findOrFail($idSolicitud)->update($datos);
    }

    public function nombreTipoMadera(int $id): string
    {
        return (string) TipoMaderaModel::whereKey($id)->value('nombre');
    }

    public function nombreUsuario(int $id): string
    {
        $u = UsuarioModel::find($id);

        return $u ? "{$u->apellido}, {$u->nombre}" : "#{$id}";
    }
}
