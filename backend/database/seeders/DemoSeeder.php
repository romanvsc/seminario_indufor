<?php

namespace Database\Seeders;

use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\RolModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Logistics\Infrastructure\RemitoModel;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Production\Infrastructure\ProduccionModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Datos de demostración para la defensa (docs/demo.md): un usuario por rol en las tres unidades forestales,
 * su flota y algunos registros que dejan a la vista cada circuito (pendientes, falla abierta, matafuego vencido,
 * viaje sin remito). Solo fuera de producción y con SEED_DEMO_PASSWORD; no forma parte de DatabaseSeeder
 * para que los E2E sigan arrancando de una base limpia.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_DEMO_PASSWORD');
        if (app()->isProduction() || ! $password) {
            $this->command?->warn('DemoSeeder omitido (producción o sin SEED_DEMO_PASSWORD).');

            return;
        }
        $this->call([RbacSeeder::class, FrentesSeeder::class, TiposMaderaSeeder::class]);

        $frente = fn (string $n) => FrenteModel::where('nombre_frente', $n)->value('id_frente');
        $papel = $frente('Papel Misionero');
        $bosques = $frente('Bosques del Plata');
        $prusia = $frente('Prusia');

        $u = fn (string $email, string $nombre, string $apellido, Rol $rol) => $this->usuario($email, $nombre, $apellido, $rol, $password);
        $adm = $u('ana.adm@indufor.demo', 'Ana', 'Administración', Rol::Administracion);
        $u('gustavo.ger@indufor.demo', 'Gustavo', 'Gerencia', Rol::Gerencia);
        $encPapel = $u('elena.enc@indufor.demo', 'Elena', 'Encargada', Rol::Encargado);
        $encBosques = $u('bruno.enc@indufor.demo', 'Bruno', 'Encargado', Rol::Encargado);
        $opePrusia = $u('omar.ope@indufor.demo', 'Omar', 'Operario', Rol::Operario);
        $cam = $u('carla.cam@indufor.demo', 'Carla', 'Camionera', Rol::Camionero);
        $u('lucas.log@indufor.demo', 'Lucas', 'Logística', Rol::Logistica);
        $man = $u('marta.man@indufor.demo', 'Marta', 'Mantenimiento', Rol::Mantenimiento);

        $desde = now()->subMonths(2)->startOfMonth()->toDateString();
        foreach ([[$papel, $encPapel], [$bosques, $encBosques], [$prusia, $opePrusia]] as [$idFrente, $usuario]) {
            AsignacionModel::firstOrCreate(['id_frente' => $idFrente, 'id_usuario' => $usuario->id_usuario], ['fecha_desde' => $desde]);
        }

        $tipo = fn (string $n, string $m) => TipoMaquinariaModel::firstOrCreate(['nombre' => $n], ['metrica' => $m])->id_tipo_maquinaria;
        $unidad = fn (array $d) => UnidadModel::firstOrCreate(['nombre' => $d['nombre']], $d + ['estado_activo' => true])->id_unidad;
        $harvester = $tipo('Harvester', 'HOROMETRO');
        $skidder = $tipo('Skidder', 'HOROMETRO');
        $camioneta = $tipo('Camioneta', 'KILOMETRAJE');
        $camionTipo = $tipo('Camión', 'KILOMETRAJE');
        $hvPapel = $unidad(['nombre' => 'HV-PM1', 'marca_modelo' => 'Ponsse Ergo', 'id_tipo_maquinaria' => $harvester, 'id_frente_actual' => $papel]);
        $skBosques = $unidad(['nombre' => 'SK-BP1', 'marca_modelo' => 'Tigercat 630', 'id_tipo_maquinaria' => $skidder, 'id_frente_actual' => $bosques]);
        $hvPrusia = $unidad(['nombre' => 'HV-PR1', 'marca_modelo' => 'John Deere 1270', 'id_tipo_maquinaria' => $harvester, 'id_frente_actual' => $prusia]);
        // Sin frente: las cargan sus responsables (D28)
        $unidad(['nombre' => 'CT-01', 'dominio_patente' => 'AE123CD', 'marca_modelo' => 'Toyota Hilux', 'id_tipo_maquinaria' => $camioneta, 'id_usuario' => $opePrusia->id_usuario]);
        $camion = $unidad(['nombre' => 'CM-01', 'dominio_patente' => 'AB456EF', 'marca_modelo' => 'Scania R450', 'id_tipo_maquinaria' => $camionTipo, 'id_usuario' => $cam->id_usuario]);

        if (ProduccionModel::whereIn('id_usuario', [$encPapel->id_usuario, $opePrusia->id_usuario])->exists()) {
            $this->command?->info('DemoSeeder: los registros de demostración ya existían; solo se actualizaron usuarios y flota.');

            return;
        }

        $pulpable = TipoMaderaModel::where('nombre', 'pulpable')->value('id_tipo_madera');
        $aserrable = TipoMaderaModel::where('nombre', 'aserrable')->value('id_tipo_madera');
        $dia = fn (int $atras) => now()->subDays($atras)->toDateString();
        $lunes = now()->startOfWeek(Carbon::MONDAY);

        // Producción de la quincena: consolidada en Papel Misionero, individual en Prusia (RF01–RF03)
        foreach ([[1, 32.5, $pulpable], [2, 28.0, $aserrable]] as [$atras, $t, $madera]) {
            ProduccionModel::create(['id_unidad' => $hvPapel, 'id_usuario' => $encPapel->id_usuario, 'id_frente' => $papel, 'tipo_madera' => $madera, 'fecha_registro' => $dia($atras), 'cantidad_toneladas' => $t]);
        }
        ProduccionModel::create(['id_unidad' => $hvPrusia, 'id_usuario' => $opePrusia->id_usuario, 'id_operario' => $opePrusia->id_usuario, 'id_frente' => $prusia, 'tipo_madera' => $aserrable, 'fecha_registro' => $dia(1), 'cantidad_toneladas' => 12.0]);

        // Lecturas: HV-PM1 quedó sin lectura esta semana; SK-BP1 tiene una falla abierta (RF09, RF10)
        LecturaModel::create(['id_unidad' => $hvPapel, 'id_operario_reporte' => $encPapel->id_usuario, 'fecha_lectura' => $lunes->copy()->subDays(6)->setTime(8, 0), 'horometro_actual' => 1250.5, 'tiene_falla' => false]);
        LecturaModel::create(['id_unidad' => $skBosques, 'id_operario_reporte' => $encBosques->id_usuario, 'fecha_lectura' => $lunes->copy()->setTime(8, 0), 'horometro_actual' => 840.0, 'tiene_falla' => true, 'detalle_falla' => 'El display del horómetro parpadea y por momentos no enciende']);
        LecturaModel::create(['id_unidad' => $hvPrusia, 'id_operario_reporte' => $opePrusia->id_usuario, 'fecha_lectura' => $lunes->copy()->setTime(9, 0), 'horometro_actual' => 2310.0, 'tiene_falla' => false]);

        // Matafuego de HV-PR1 con la carga vencida (RF11)
        ControlMatafuegoModel::create(['id_unidad' => $hvPrusia, 'id_operario' => $opePrusia->id_usuario, 'estado_matafuego' => 'OK', 'fecha_revision' => $dia(40), 'fecha_vencimiento_carga' => $dia(5), 'etiqueta_ilegible' => false]);
        ControlMatafuegoModel::create(['id_unidad' => $hvPapel, 'id_operario' => $man->id_usuario, 'estado_matafuego' => 'OK', 'fecha_revision' => $dia(3), 'fecha_vencimiento_carga' => now()->addYear()->toDateString(), 'etiqueta_ilegible' => false]);

        // Viajes: uno validado con su remito y otro esperando remito (RF05–RF07)
        $viaje = fn (int $atras, string $destino) => ViajeModel::create([
            'id_unidad_camion' => $camion, 'id_usuario_camionero' => $cam->id_usuario, 'id_frente_origen' => $papel, 'fecha' => now()->subDays($atras)->setTime(7, 30),
            'destino' => $destino, 'tipo_madera' => $pulpable, 'volumen_declarado' => 30.0, 'estado_validacion' => $atras > 1 ? 'VALIDADO' : 'PENDIENTE',
        ]);
        $validado = $viaje(3, 'Planta Puerto Esperanza');
        RemitoModel::create(['numero_remito' => 'A-0001-00001234', 'id_viaje' => $validado->id_viaje, 'fecha_remito' => $dia(3), 'id_transportista' => $cam->id_usuario,
            'tipo_madera_remito' => $pulpable, 'volumen_toneladas_remito' => 30.0, 'fecha_recepcion_admin' => now()->subDays(2)]);
        $viaje(1, 'Planta Puerto Esperanza');

        $this->command?->info("DemoSeeder: 8 usuarios (@indufor.demo), 5 unidades y registros de muestra. Administración: {$adm->email}");
    }

    private function usuario(string $email, string $nombre, string $apellido, Rol $rol, string $password): UsuarioModel
    {
        $u = UsuarioModel::updateOrCreate(['email' => $email], ['nombre' => $nombre, 'apellido' => $apellido, 'password' => $password, 'estado_activo' => true]);
        $u->roles()->syncWithoutDetaching([RolModel::where('codigo', $rol->value)->value('id_rol') => ['created_at' => now()]]);

        return $u;
    }
}
