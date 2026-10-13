<?php

use App\Contexts\IdentityAccess\Domain\Rol;

it('inicia sesión con credenciales válidas y devuelve roles y permisos', function () {
    $u = usuarioCon(Rol::Encargado);

    $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => strtoupper($u->email), 'password' => 'clave-segura-1'])
        ->assertOk()
        ->assertJsonPath('data.email', $u->email)
        ->assertJsonPath('data.roles.0.codigo', 'encargado')
        ->assertJsonFragment(['production.create']);

    expect($u->fresh()->ultimo_acceso_at)->not->toBeNull();
    $this->assertAuthenticatedAs($u, 'web');
});

it('rechaza contraseña incorrecta con el formato de error uniforme', function () {
    $u = usuarioCon(Rol::Encargado);

    $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => $u->email, 'password' => 'otra'])
        ->assertStatus(422)
        ->assertExactJson(['error' => ['code' => 'CREDENCIALES_INVALIDAS', 'message' => 'El email o la contraseña no son correctos.']]);
    $this->assertGuest('web');
});

it('no deja entrar a un usuario deshabilitado y responde igual que con credenciales erróneas', function () {
    $u = usuarioCon(Rol::Gerencia);
    $u->update(['estado_activo' => false]);

    $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => $u->email, 'password' => 'clave-segura-1'])
        ->assertStatus(422)->assertJsonPath('error.code', 'CREDENCIALES_INVALIDAS');
});

it('valida los campos del login', function () {
    $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => 'no-es-email'])
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'VALIDACION')
        ->assertJsonStructure(['error' => ['details' => ['email', 'password']]]);
});

it('limita los intentos de login a 5 por minuto', function () {
    $u = usuarioCon(Rol::Encargado);
    foreach (range(1, 5) as $_) {
        $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => $u->email, 'password' => 'mal']);
    }
    $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => $u->email, 'password' => 'clave-segura-1'])
        ->assertStatus(429)->assertJsonPath('error.code', 'DEMASIADOS_INTENTOS');
});

it('exige sesión para /auth/me', function () {
    $this->getJson('/api/v1/auth/me')->assertStatus(401)->assertJsonPath('error.code', 'NO_AUTENTICADO');
});

it('devuelve el usuario actual y cierra la sesión', function () {
    $u = usuarioCon(Rol::Camionero);
    $this->withHeaders(SPA)->postJson('/api/v1/auth/login', ['email' => $u->email, 'password' => 'clave-segura-1'])->assertOk();

    $this->withHeaders(SPA)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $u->id_usuario);
    $this->withHeaders(SPA)->postJson('/api/v1/auth/logout')->assertNoContent();
    $this->assertGuest('web');
});
