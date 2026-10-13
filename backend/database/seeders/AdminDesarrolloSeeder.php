<?php

namespace Database\Seeders;

use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\RolModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Database\Seeder;

/**
 * Administrador inicial para desarrollo. Las credenciales salen de SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD
 * del .env local; si no están definidas no se crea nada. Nunca corre en producción.
 */
class AdminDesarrolloSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SEED_ADMIN_EMAIL');
        $password = env('SEED_ADMIN_PASSWORD');
        if (app()->isProduction() || ! $email || ! $password) {
            $this->command?->warn('AdminDesarrolloSeeder omitido (producción o sin SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD).');

            return;
        }

        $admin = UsuarioModel::updateOrCreate(
            ['email' => mb_strtolower($email)],
            ['nombre' => 'Administración', 'apellido' => 'INDUFOR', 'password' => $password, 'estado_activo' => true],
        );
        $admin->roles()->syncWithoutDetaching([
            RolModel::where('codigo', Rol::Administracion->value)->value('id_rol') => ['created_at' => now()],
        ]);
    }
}
