<?php

namespace App\Contexts\Production\Infrastructure;

use App\Contexts\Frentes\Domain\ModalidadProduccion;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\Production\Application\Ports\ProduccionRepositorio;

final class ProduccionRepositorioEloquent implements ProduccionRepositorio
{
    public function modalidadDeFrente(int $idFrente): ?ModalidadProduccion
    {
        return FrenteModel::where('estado_activo', true)->find($idFrente)?->modalidad_produccion;
    }

    public function estaAsignado(int $idUsuario, int $idFrente, string $fecha): bool
    {
        return AsignacionModel::where('id_usuario', $idUsuario)
            ->where('id_frente', $idFrente)
            ->where('fecha_desde', '<=', $fecha)
            ->where(fn ($q) => $q->whereNull('fecha_hasta')->orWhere('fecha_hasta', '>=', $fecha))
            ->exists();
    }

    public function crear(array $datos): int
    {
        return ProduccionModel::create($datos)->id_produccion;
    }

    public function actualizar(int $id, array $datos): void
    {
        ProduccionModel::findOrFail($id)->update($datos);
    }

    public function snapshot(int $id): ?array
    {
        $p = ProduccionModel::find($id);

        return $p === null ? null : [
            'id_produccion' => $p->id_produccion,
            'id_usuario' => $p->id_usuario,
            'id_operario' => $p->id_operario,
            'id_frente' => $p->id_frente,
            'id_unidad' => $p->id_unidad,
            'tipo_madera' => $p->tipo_madera,
            'fecha_registro' => $p->fecha_registro->format('Y-m-d'),
            'cantidad_toneladas' => $p->cantidad_toneladas,
            'metros_cubicos' => $p->metros_cubicos,
            'foto_soporte' => $p->foto_soporte,
            'observaciones' => $p->observaciones,
        ];
    }
}
