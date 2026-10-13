<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Support\Facades\Hash;

$alta = fn (array $extra = []) => array_merge([
    'nombre' => 'Ana', 'apellido' => 'Gómez', 'email' => 'Ana.Gomez@Indufor.test',
    'password' => 'segura123', 'telefono_whatsapp' => '3743000000', 'roles' => ['encargado'],
], $extra);

it('administración da de alta un usuario con roles, contraseña hasheada y auditoría sin la contraseña', function () use ($alta) {
    $admin = usuarioCon(Rol::Administracion);

    $res = $this->actingAs($admin)->postJson('/api/v1/users', $alta())
        ->assertCreated()
        ->assertJsonPath('data.email', 'ana.gomez@indufor.test')
        ->assertJsonPath('data.roles.0.codigo', 'encargado')
        ->assertJsonMissingPath('data.password');

    $nuevo = UsuarioModel::findOrFail($res->json('data.id'));
    expect(Hash::check('segura123', $nuevo->password))->toBeTrue();

    $evento = AuditoriaEventoModel::where('accion', 'usuario.creado')->sole();
    expect($evento->id_usuario)->toBe($admin->id_usuario)
        ->and($evento->after_json)->not->toHaveKey('password')
        ->and($evento->after_json['roles'])->toBe(['encargado']);
});

it('gerencia también gestiona usuarios', function () use ($alta) {
    $this->actingAs(usuarioCon(Rol::Gerencia))->postJson('/api/v1/users', $alta())->assertCreated();
});

it('rechaza emails duplicados, contraseñas débiles y roles inexistentes', function () use ($alta) {
    $admin = usuarioCon(Rol::Administracion);
    $this->actingAs($admin)->postJson('/api/v1/users', $alta())->assertCreated();

    $this->actingAs($admin)->postJson('/api/v1/users', $alta(['password' => 'corta', 'roles' => ['superusuario']]))
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'VALIDACION')
        ->assertJsonStructure(['error' => ['details' => ['email', 'password', 'roles.0']]]);
});

it('modifica datos, cambia roles y lo audita', function () use ($alta) {
    $admin = usuarioCon(Rol::Administracion);
    $id = $this->actingAs($admin)->postJson('/api/v1/users', $alta())->json('data.id');

    $this->actingAs($admin)->putJson("/api/v1/users/{$id}", ['nombre' => 'Ana María', 'apellido' => 'Gómez', 'email' => 'ana.gomez@indufor.test'])
        ->assertOk()->assertJsonPath('data.nombre', 'Ana María');
    $this->actingAs($admin)->putJson("/api/v1/users/{$id}/roles", ['roles' => ['operario', 'camionero']])
        ->assertOk()->assertJsonCount(2, 'data.roles');

    $cambio = AuditoriaEventoModel::where('accion', 'usuario.roles_cambiados')->sole();
    expect($cambio->before_json['roles'])->toBe(['encargado'])
        ->and($cambio->after_json['roles'])->toBe(['camionero', 'operario']);
});

it('da de baja y de alta en forma lógica: el usuario nunca se borra', function () use ($alta) {
    $admin = usuarioCon(Rol::Administracion);
    $id = $this->actingAs($admin)->postJson('/api/v1/users', $alta())->json('data.id');

    $this->actingAs($admin)->postJson("/api/v1/users/{$id}/disable")->assertOk()->assertJsonPath('data.estado_activo', false);
    expect(UsuarioModel::find($id))->not->toBeNull();
    $this->actingAs($admin)->getJson('/api/v1/users')->assertJsonMissing(['id' => $id]);
    $this->actingAs($admin)->getJson('/api/v1/users?estado=inactivos')->assertJsonFragment(['id' => $id]);

    $this->actingAs($admin)->postJson("/api/v1/users/{$id}/enable")->assertOk()->assertJsonPath('data.estado_activo', true);
    expect(AuditoriaEventoModel::whereIn('accion', ['usuario.deshabilitado', 'usuario.habilitado'])->count())->toBe(2);
});

it('impide que un usuario se deshabilite a sí mismo', function () {
    $admin = usuarioCon(Rol::Administracion);
    $this->actingAs($admin)->postJson("/api/v1/users/{$admin->id_usuario}/disable")
        ->assertStatus(422)->assertJsonPath('error.code', 'USUARIO_AUTODESHABILITACION');
    expect(AuditoriaEventoModel::count())->toBe(0);
});

it('un usuario deshabilitado pierde sus permisos aunque tenga sesión', function () {
    $ger = usuarioCon(Rol::Gerencia);
    $ger->update(['estado_activo' => false]);
    $this->actingAs($ger)->getJson('/api/v1/users')->assertForbidden();
});

it('lista paginada con filtros y responde 404 uniforme', function () {
    $admin = usuarioCon(Rol::Administracion);
    usuarioCon(Rol::Camionero);
    $this->actingAs($admin)->getJson('/api/v1/users?rol=camionero')->assertOk()->assertJsonCount(1, 'data')->assertJsonStructure(['data', 'links', 'meta']);
    $this->actingAs($admin)->getJson('/api/v1/users/999999')->assertNotFound()->assertJsonPath('error.code', 'NO_ENCONTRADO');
});
