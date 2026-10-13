<?php

namespace Database\Seeders;

use App\Contexts\IdentityAccess\Domain\MatrizRbac;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\PermisoModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\RolModel;
use Illuminate\Database\Seeder;

/** Catálogo de permisos, roles y matriz (docs/rbac.md). Idempotente: se puede correr en cada despliegue. */
class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $ids = [];
        foreach (Permiso::cases() as $p) {
            $ids[$p->value] = PermisoModel::updateOrCreate(['codigo' => $p->value])->id_permiso;
        }

        foreach (Rol::cases() as $r) {
            $rol = RolModel::updateOrCreate(['codigo' => $r->value], ['nombre' => $r->nombre(), 'estado_activo' => true]);
            $rol->permisos()->sync(array_map(fn (Permiso $p) => $ids[$p->value], MatrizRbac::permisosDe($r)));
        }
    }
}
