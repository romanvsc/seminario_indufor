<?php

namespace App\Contexts\IdentityAccess\Infrastructure\Persistence;

use App\Contexts\IdentityAccess\Application\Ports\UsuarioRepositorio;

final class UsuarioRepositorioEloquent implements UsuarioRepositorio
{
    public function crear(array $datos): int
    {
        return UsuarioModel::create($datos)->id_usuario;
    }

    public function actualizar(int $id, array $datos): void
    {
        UsuarioModel::findOrFail($id)->update($datos);
    }

    public function sincronizarRoles(int $id, array $codigosRol): void
    {
        $ids = RolModel::whereIn('codigo', $codigosRol)->pluck('id_rol')->all();
        $pivot = array_fill_keys($ids, ['created_at' => now()]);
        UsuarioModel::findOrFail($id)->roles()->sync($pivot);
    }

    public function snapshot(int $id): ?array
    {
        $u = UsuarioModel::with('roles')->find($id);

        return $u === null ? null : [
            'id_usuario' => $u->id_usuario,
            'nombre' => $u->nombre,
            'apellido' => $u->apellido,
            'email' => $u->email,
            'telefono_whatsapp' => $u->telefono_whatsapp,
            'estado_activo' => $u->estado_activo,
            'roles' => $u->roles->pluck('codigo')->sort()->values()->all(),
        ];
    }
}
