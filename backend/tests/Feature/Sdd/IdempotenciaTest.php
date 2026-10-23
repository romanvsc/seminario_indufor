<?php

use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Production\Infrastructure\ProduccionModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Database\Seeders\FrentesSeeder;
use Database\Seeders\TiposMaderaSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

// specs/05-idempotencia.md — una misma operación no produce dos registros (D22)

beforeEach(function () {
    $this->seed([FrentesSeeder::class, TiposMaderaSeeder::class]);
    $this->travelTo('2026-10-21 10:00');
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->hv = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo])->id_unidad;
    $this->papel = FrenteModel::where('nombre_frente', 'Papel Misionero')->sole()->id_frente;
    $this->enc = usuarioCon(Rol::Encargado);
    AsignacionModel::create(['id_frente' => $this->papel, 'id_usuario' => $this->enc->id_usuario, 'fecha_desde' => '2026-10-01']);
    $this->parte = fn (array $extra = []) => array_merge([
        'id_frente' => $this->papel, 'id_unidad' => $this->hv, 'tipo_madera' => TipoMaderaModel::where('nombre', 'pulpable')->value('id_tipo_madera'),
        'fecha_registro' => '2026-10-21', 'cantidad_toneladas' => 30,
    ], $extra);
    $this->post = fn (array $datos, string $clave) => $this->actingAs($this->enc)->postJson('/api/v1/production', $datos, ['Idempotency-Key' => $clave]);
});

it('CA-05.1: el segundo envío con la misma clave choca con el índice único y devuelve el mismo parte', function () {
    $id = ($this->post)(($this->parte)(), 'K1')->assertCreated()->json('data.id');
    ($this->post)(($this->parte)(), 'K1')->assertOk()->assertJsonPath('data.id', $id);

    expect(ProduccionModel::count())->toBe(1)
        ->and(DB::table('idempotencia')->where('clave', 'K1')->sole())->toMatchArray(['operacion' => 'parte', 'entidad_id' => $id]);
});

it('CA-05.2 / CA-05.6: el reintento al día siguiente o después de limpiar la caché no duplica', function () {
    $id = ($this->post)(($this->parte)(), 'K2')->assertCreated()->json('data.id');
    $this->travel(25)->hours();
    Artisan::call('cache:clear');
    ($this->post)(($this->parte)(), 'K2')->assertOk()->assertJsonPath('data.id', $id);
    expect(ProduccionModel::count())->toBe(1);
});

it('CA-05.3: la misma clave con otros datos se rechaza con 409 y no crea nada', function () {
    ($this->post)(($this->parte)(), 'K3')->assertCreated();
    ($this->post)(($this->parte)(['cantidad_toneladas' => 31]), 'K3')
        ->assertStatus(409)->assertJsonPath('error.code', 'CLAVE_REUTILIZADA');
    expect(ProduccionModel::count())->toBe(1);
});

it('CA-05.4: si el alta falla, la clave no queda tomada y el reintento corregido crea el registro', function () {
    ($this->post)(($this->parte)(['fecha_registro' => '2026-09-15']), 'K4')->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION');
    expect(DB::table('idempotencia')->count())->toBe(0);
    ($this->post)(($this->parte)(), 'K4')->assertCreated();
});

it('CA-05.5: la misma clave en otra operación es otra clave; viajes y lecturas tampoco duplican', function () {
    ($this->post)(($this->parte)(), 'K5')->assertCreated();
    $op = usuarioCon(Rol::Operario);
    $lectura = ['id_unidad' => $this->hv, 'fecha_lectura' => '2026-10-21T08:00', 'horometro_actual' => 100, 'tiene_falla' => false];
    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', $lectura, ['Idempotency-Key' => 'K5'])->assertCreated();
    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', $lectura, ['Idempotency-Key' => 'K5'])->assertOk();
    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', [...$lectura, 'horometro_actual' => 101], ['Idempotency-Key' => 'K5'])->assertStatus(409);

    $cam = usuarioCon(Rol::Camionero);
    $viaje = ['id_unidad_camion' => $this->hv, 'id_frente_origen' => $this->papel, 'fecha' => '2026-10-21T08:30', 'destino' => 'Planta', 'tipo_madera' => ($this->parte)()['tipo_madera'], 'volumen_declarado' => 30];
    $this->actingAs($cam)->postJson('/api/v1/logistics/trips', $viaje, ['Idempotency-Key' => 'K5'])->assertCreated();
    $this->actingAs($cam)->postJson('/api/v1/logistics/trips', $viaje, ['Idempotency-Key' => 'K5'])->assertOk();

    expect(LecturaModel::count())->toBe(1)->and(ViajeModel::count())->toBe(1)->and(ProduccionModel::count())->toBe(1);
});

it('sin clave cada envío crea su registro (compatibilidad)', function () {
    $this->actingAs($this->enc)->postJson('/api/v1/production', ($this->parte)())->assertCreated();
    $this->actingAs($this->enc)->postJson('/api/v1/production', ($this->parte)())->assertCreated();
    expect(ProduccionModel::count())->toBe(2);
});

it('specs/04 T-04.4: la respuesta indica si el registro ya existía (resultado incierto)', function () {
    ($this->post)(($this->parte)(), 'K6')->assertCreated()->assertJsonPath('ya_registrado', false);
    ($this->post)(($this->parte)(), 'K6')->assertOk()->assertJsonPath('ya_registrado', true);
});
