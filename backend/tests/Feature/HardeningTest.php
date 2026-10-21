<?php

use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Support\Facades\Hash;

// Fase 7: endurecimiento (Context.md §21)

it('la API responde con cabeceras de seguridad', function () {
    $this->actingAs(usuarioCon(Rol::Operario))->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});

it('limita los pedidos por minuto a la API con el error estándar', function () {
    config(['auth.api_max_per_minute' => 3]);
    $u = usuarioCon(Rol::Operario);
    foreach (range(1, 3) as $_) {
        $this->actingAs($u)->getJson('/api/v1/auth/me')->assertOk();
    }
    $this->actingAs($u)->getJson('/api/v1/auth/me')->assertStatus(429)->assertJsonPath('error.code', 'DEMASIADOS_INTENTOS');
});

it('sin debug, un error no expone trazas ni la excepción', function () {
    config(['app.debug' => false]);
    $this->getJson('/api/v1/no-existe')->assertNotFound()->assertJsonMissingPath('exception')->assertJsonPath('error.code', 'NO_ENCONTRADO');
});

it('el comando crea el primer administrador con la contraseña hasheada y valida su fortaleza', function () {
    $this->artisan('usuarios:crear-admin', ['email' => 'Jefa@Indufor.test'])
        ->expectsQuestion('Contraseña (mínimo 8, con letras y números)', 'corta')
        ->expectsQuestion('Repetila', 'corta')
        ->assertExitCode(1);

    $this->artisan('usuarios:crear-admin', ['email' => 'Jefa@Indufor.test'])
        ->expectsQuestion('Contraseña (mínimo 8, con letras y números)', 'segura2026')
        ->expectsQuestion('Repetila', 'segura2026')
        ->assertExitCode(0);

    $u = UsuarioModel::where('email', 'jefa@indufor.test')->sole();
    expect(Hash::check('segura2026', $u->password))->toBeTrue()
        ->and($u->tienePermiso('users.create'))->toBeTrue();
});
