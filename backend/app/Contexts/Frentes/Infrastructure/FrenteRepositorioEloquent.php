<?php

namespace App\Contexts\Frentes\Infrastructure;

use App\Contexts\Frentes\Application\Ports\FrenteRepositorio;

final class FrenteRepositorioEloquent implements FrenteRepositorio
{
    public function crear(array $datos): int
    {
        return FrenteModel::create($datos)->id_frente;
    }

    public function actualizar(int $id, array $datos): void
    {
        FrenteModel::findOrFail($id)->update($datos);
    }

    public function snapshot(int $id): ?array
    {
        $f = FrenteModel::find($id);

        return $f === null ? null : [
            'id_frente' => $f->id_frente,
            'nombre_frente' => $f->nombre_frente,
            'ubicacion_geografica' => $f->ubicacion_geografica,
            'modalidad_produccion' => $f->modalidad_produccion->value,
            'estado_activo' => $f->estado_activo,
        ];
    }

    public function crearAsignacion(int $idFrente, int $idUsuario, string $desde, ?string $hasta): int
    {
        return AsignacionModel::create(['id_frente' => $idFrente, 'id_usuario' => $idUsuario, 'fecha_desde' => $desde, 'fecha_hasta' => $hasta])->id_asignacion;
    }

    public function finalizarAsignacion(int $idAsignacion, string $hasta): void
    {
        AsignacionModel::findOrFail($idAsignacion)->update(['fecha_hasta' => $hasta]);
    }

    public function asignacion(int $idAsignacion): ?array
    {
        $a = AsignacionModel::find($idAsignacion);

        return $a === null ? null : [
            'id_asignacion' => $a->id_asignacion,
            'id_frente' => $a->id_frente,
            'id_usuario' => $a->id_usuario,
            'fecha_desde' => $a->fecha_desde->format('Y-m-d'),
            'fecha_hasta' => $a->fecha_hasta?->format('Y-m-d'),
        ];
    }

    public function haySuperposicion(int $idFrente, int $idUsuario, string $desde, ?string $hasta): bool
    {
        // Bloquea la fila del frente hasta el commit: dos altas simultáneas no pueden superponerse
        FrenteModel::whereKey($idFrente)->lockForUpdate()->first();

        return AsignacionModel::where('id_frente', $idFrente)
            ->where('id_usuario', $idUsuario)
            ->when($hasta !== null, fn ($q) => $q->where('fecha_desde', '<=', $hasta))
            ->where(fn ($q) => $q->whereNull('fecha_hasta')->orWhere('fecha_hasta', '>=', $desde))
            ->exists();
    }
}
