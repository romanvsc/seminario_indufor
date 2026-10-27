<?php

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Production\Infrastructure\ProduccionModel;
use Database\Seeders\DemoSeeder;

// docs/demo.md: la demo se arma con un comando y no duplica nada si se repite
afterEach(function () {
    putenv('SEED_DEMO_PASSWORD');
    unset($_ENV['SEED_DEMO_PASSWORD'], $_SERVER['SEED_DEMO_PASSWORD']);
});

it('sin SEED_DEMO_PASSWORD no crea nada', function () {
    // Vacía explícitamente: el .env local de quien corre los tests puede tenerla definida
    putenv('SEED_DEMO_PASSWORD=');
    $_ENV['SEED_DEMO_PASSWORD'] = $_SERVER['SEED_DEMO_PASSWORD'] = '';
    $this->seed(DemoSeeder::class);
    expect(UsuarioModel::where('email', 'like', '%@indufor.demo')->count())->toBe(0);
});

it('crea un usuario por rol con sus datos de muestra, y repetirlo no duplica', function () {
    putenv('SEED_DEMO_PASSWORD=demo-2026');
    $_ENV['SEED_DEMO_PASSWORD'] = $_SERVER['SEED_DEMO_PASSWORD'] = 'demo-2026';
    $this->seed(DemoSeeder::class);
    $this->seed(DemoSeeder::class);

    expect(UsuarioModel::where('email', 'like', '%@indufor.demo')->count())->toBe(8)
        ->and(ProduccionModel::count())->toBe(3)
        ->and(ViajeModel::count())->toBe(2);

    // La contraseña de demo sirve para entrar; cada rol ve sus pendientes de demostración
    $this->postJson('/api/v1/auth/login', ['email' => 'marta.man@indufor.demo', 'password' => 'demo-2026'], SPA)->assertOk();
    $this->getJson('/api/v1/me/pending', SPA)->assertJsonPath('data.fallas_abiertas', 1)->assertJsonPath('data.matafuegos_vencidos', 1);
    $adm = UsuarioModel::where('email', 'ana.adm@indufor.demo')->sole();
    $this->actingAs($adm)->getJson('/api/v1/me/pending')->assertJsonPath('data.viajes_sin_remito', 1);
});
