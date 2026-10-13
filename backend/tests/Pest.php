<?php

use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\RolModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => $this->seed(RbacSeeder::class))
    ->in('Feature');

/** Origen de la SPA: activa la sesión de Sanctum en las peticiones de test. */
const SPA = ['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/'];

/** Crea un usuario activo con los roles indicados. */
function usuarioCon(Rol ...$roles): UsuarioModel
{
    static $n = 0;
    $n++;
    $u = UsuarioModel::create([
        'nombre' => "Usuario{$n}",
        'apellido' => 'Prueba',
        'email' => "usuario{$n}@indufor.test",
        'password' => 'clave-segura-1',
    ]);
    $ids = RolModel::whereIn('codigo', array_map(fn (Rol $r) => $r->value, $roles))->pluck('id_rol');
    $u->roles()->sync($ids->mapWithKeys(fn ($id) => [$id => ['created_at' => now()]])->all());

    return $u->fresh();
}
