<?php

use App\Contexts\IdentityAccess\Domain\MatrizRbac;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\IdentityAccess\Domain\Rol;

/** Lee las tablas de docs/rbac.md: permiso → roles marcados con ✓. */
function matrizDocumentada(): array
{
    $orden = ['adm' => Rol::Administracion, 'ger' => Rol::Gerencia, 'enc' => Rol::Encargado, 'ope' => Rol::Operario,
        'cam' => Rol::Camionero, 'log' => Rol::Logistica, 'man' => Rol::Mantenimiento];
    $md = file_get_contents(base_path('../docs/rbac.md'));
    $matriz = array_fill_keys(array_map(fn (Rol $r) => $r->value, Rol::cases()), []);
    foreach (explode("\n", $md) as $linea) {
        if (! str_starts_with($linea, '| `')) {
            continue;
        }
        $celdas = array_map('trim', explode('|', trim($linea, " |\r")));
        preg_match_all('/`([a-z.\-]+)`/', $celdas[0], $m);
        foreach (array_values($orden) as $i => $rol) {
            if (($celdas[$i + 1] ?? '') === '✓') {
                array_push($matriz[$rol->value], ...$m[1]);
            }
        }
    }

    return array_map(function ($p) {
        sort($p);

        return array_values(array_unique($p));
    }, $matriz);
}

it('la matriz del código coincide exactamente con docs/rbac.md', function () {
    $codigo = [];
    foreach (Rol::cases() as $rol) {
        $p = array_map(fn (Permiso $x) => $x->value, MatrizRbac::permisosDe($rol));
        sort($p);
        $codigo[$rol->value] = array_values(array_unique($p));
    }
    expect($codigo)->toBe(matrizDocumentada());
});

it('todo permiso del catálogo está asignado al menos a un rol', function () {
    $usados = collect(Rol::cases())->flatMap(fn (Rol $r) => MatrizRbac::permisosDe($r))->map->value->unique();
    expect($usados->sort()->values()->all())->toBe(collect(Permiso::cases())->map->value->sort()->values()->all());
});

// Acceso a la gestión de usuarios por rol: permitido (2xx) o denegado (403)
dataset('roles', fn () => array_map(fn (Rol $r) => [$r], Rol::cases()));

it('aplica users.view, users.create, users.update y users.disable según la matriz', function (Rol $rol) {
    $actor = usuarioCon($rol);
    $otro = usuarioCon(Rol::Camionero);
    $puede = fn (Permiso $p) => in_array($p, MatrizRbac::permisosDe($rol), true);
    $esperar = fn ($res, Permiso $p) => $puede($p) ? expect($res->status())->toBeLessThan(300) : $res->assertForbidden();

    $esperar($this->actingAs($actor)->getJson('/api/v1/users'), Permiso::UsersView);
    $esperar($this->actingAs($actor)->getJson('/api/v1/roles'), Permiso::UsersView);
    $esperar($this->actingAs($actor)->postJson('/api/v1/users', [
        'nombre' => 'N', 'apellido' => 'A', 'email' => "nuevo-{$rol->value}@indufor.test", 'password' => 'segura123', 'roles' => ['camionero'],
    ]), Permiso::UsersCreate);
    $esperar($this->actingAs($actor)->putJson("/api/v1/users/{$otro->id_usuario}/roles", ['roles' => ['logistica']]), Permiso::UsersUpdate);
    $esperar($this->actingAs($actor)->postJson("/api/v1/users/{$otro->id_usuario}/disable"), Permiso::UsersDisable);
})->with('roles');
