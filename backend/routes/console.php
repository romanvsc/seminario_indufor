<?php

use App\Contexts\ExternalCosts\Application\GestionIntegracion;
use App\Contexts\ExternalCosts\Infrastructure\SimuladorSistemaExterno;
use App\Contexts\IdentityAccess\Application\GestionUsuarios;
use App\Contexts\IdentityAccess\Domain\Rol;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Primer administrador en producción (el seeder de desarrollo no corre ahí). La contraseña se pide oculta y no queda en el historial.
Artisan::command('usuarios:crear-admin {email} {--nombre=Administración} {--apellido=INDUFOR}', function (GestionUsuarios $gestion, string $email) {
    $password = (string) $this->secret('Contraseña (mínimo 8, con letras y números)');
    $datos = ['nombre' => $this->option('nombre'), 'apellido' => $this->option('apellido'), 'email' => mb_strtolower(trim($email)), 'password' => $password];
    $v = Validator::make($datos + ['password_confirmation' => (string) $this->secret('Repetila')], [
        'email' => ['required', 'email', 'max:190', 'unique:usuario,email'],
        'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
    ]);
    if ($v->fails()) {
        foreach ($v->errors()->all() as $e) {
            $this->error($e);
        }

        return 1;
    }
    $id = $gestion->crear($datos, [Rol::Administracion->value]);
    $this->info("Administrador #{$id} creado: {$datos['email']}");
})->purpose('Crea un usuario con rol Administración');

// RF12 / ADR-004: red de seguridad de la exportación automática; solo reenvía lo que quedó pendiente
Artisan::command('integracion:exportar-pendientes', function (GestionIntegracion $gestion) {
    $r = $gestion->exportarPendientes(now()->format('Y-m-d H:i:s'));
    $this->info("Exportadas: {$r['exportadas']} · con error: {$r['con_error']}");
})->purpose('Reintenta la exportación de lecturas pendientes al sistema externo');

Schedule::command('integracion:exportar-pendientes')->everyFifteenMinutes()->withoutOverlapping();

// Simulador del sistema externo para la entrega del TP (D13): genera el consolidado mensual CSV v1
Artisan::command('simulador:consumos {periodo}', function (string $periodo) {
    abort_if(app()->isProduction(), 1, 'El simulador no corre en producción.');
    abort_unless((bool) preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $periodo), 1, 'El período debe tener el formato AAAA-MM.');
    $ruta = "integracion/entrada/consumos-{$periodo}.csv";
    Storage::disk('local')->put($ruta, SimuladorSistemaExterno::consolidado($periodo));
    $this->info('Consolidado simulado en '.Storage::disk('local')->path($ruta));
})->purpose('Genera un consolidado mensual de prueba (CSV v1)');
