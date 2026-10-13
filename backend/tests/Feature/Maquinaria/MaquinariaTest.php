<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use Database\Seeders\FrentesSeeder;

beforeEach(fn () => $this->seed(FrentesSeeder::class));

$tipo = fn ($test, $admin, string $nombre = 'Forwarder', string $metrica = 'HOROMETRO') => $test->actingAs($admin)
    ->postJson('/api/v1/machinery-types', ['nombre' => $nombre, 'metrica' => $metrica])->assertCreated()->json('data.id');

it('administración crea tipos con su métrica (D08) y rechaza métricas inválidas o nombres repetidos', function () use ($tipo) {
    $admin = usuarioCon(Rol::Administracion);
    $tipo($this, $admin);

    $this->actingAs($admin)->postJson('/api/v1/machinery-types', ['nombre' => 'Forwarder', 'metrica' => 'LITROS'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['nombre', 'metrica']]]);
    $this->actingAs(usuarioCon(Rol::Operario))->getJson('/api/v1/machinery-types')
        ->assertOk()->assertJsonPath('data.0.metrica', 'HOROMETRO');
});

it('da de alta una unidad con tipo, frente y responsable; normaliza la patente y audita', function () use ($tipo) {
    $admin = usuarioCon(Rol::Administracion);
    $op = usuarioCon(Rol::Operario);
    $prusia = FrenteModel::where('nombre_frente', 'Prusia')->sole()->id_frente;

    $id = $this->actingAs($admin)->postJson('/api/v1/machinery', [
        'nombre' => 'Camión 1', 'dominio_patente' => 'ab 123 cd', 'marca_modelo' => 'Scania R450',
        'id_tipo_maquinaria' => $tipo($this, $admin, 'Camión', 'KILOMETRAJE'), 'id_frente_actual' => $prusia, 'id_usuario' => $op->id_usuario,
    ])->assertCreated()
        ->assertJsonPath('data.dominio_patente', 'AB123CD')
        ->assertJsonPath('data.tipo.metrica', 'KILOMETRAJE')
        ->assertJsonPath('data.frente.nombre', 'Prusia')
        ->assertJsonPath('data.usuario.id', $op->id_usuario)
        ->json('data.id');

    $this->actingAs($admin)->postJson("/api/v1/machinery/{$id}/disable")->assertOk()->assertJsonPath('data.estado_activo', false);
    $this->actingAs($admin)->postJson("/api/v1/machinery/{$id}/enable")->assertOk()->assertJsonPath('data.estado_activo', true);

    expect(AuditoriaEventoModel::where('entidad', 'maquinaria')->where('entidad_id', $id)->pluck('accion')->all())
        ->toBe(['maquinaria.creado', 'maquinaria.deshabilitado', 'maquinaria.habilitado']);
});

it('rechaza patente repetida y tipo, frente o responsable deshabilitados', function () use ($tipo) {
    $admin = usuarioCon(Rol::Administracion);
    $idTipo = $tipo($this, $admin);
    $alta = ['nombre' => 'U1', 'dominio_patente' => 'AA111AA', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $idTipo];
    $this->actingAs($admin)->postJson('/api/v1/machinery', $alta)->assertCreated();

    $this->actingAs($admin)->postJson("/api/v1/machinery-types/{$idTipo}/disable")->assertOk();
    $op = usuarioCon(Rol::Operario);
    $op->update(['estado_activo' => false]);
    FrenteModel::where('nombre_frente', 'Prusia')->update(['estado_activo' => false]);

    $this->actingAs($admin)->postJson('/api/v1/machinery', [...$alta, 'id_frente_actual' => FrenteModel::where('nombre_frente', 'Prusia')->sole()->id_frente, 'id_usuario' => $op->id_usuario])
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['dominio_patente', 'id_tipo_maquinaria', 'id_frente_actual', 'id_usuario']]]);
});

it('todos los roles consultan la flota; solo administración la gestiona', function (Rol $rol) {
    $u = usuarioCon($rol);
    $this->actingAs($u)->getJson('/api/v1/machinery')->assertOk();
    $this->actingAs($u)->getJson('/api/v1/machinery-types')->assertOk();
    $this->actingAs($u)->postJson('/api/v1/machinery-types', ['nombre' => 'X', 'metrica' => 'HOROMETRO'])->assertForbidden();
    $this->actingAs($u)->postJson('/api/v1/machinery', ['nombre' => 'X'])->assertForbidden();
})->with([Rol::Gerencia, Rol::Encargado, Rol::Operario, Rol::Camionero, Rol::Logistica, Rol::Mantenimiento]);

it('filtra unidades por texto, tipo, frente y estado', function () use ($tipo) {
    $admin = usuarioCon(Rol::Administracion);
    $t1 = $tipo($this, $admin, 'Forwarder');
    $t2 = $tipo($this, $admin, 'Camión', 'KILOMETRAJE');
    $prusia = FrenteModel::where('nombre_frente', 'Prusia')->sole()->id_frente;
    $alta = fn (array $d) => $this->actingAs($admin)->postJson('/api/v1/machinery', ['marca_modelo' => 'X', ...$d])->assertCreated()->json('data.id');
    $alta(['nombre' => 'FW-01', 'id_tipo_maquinaria' => $t1, 'id_frente_actual' => $prusia]);
    $alta(['nombre' => 'Camión 2', 'dominio_patente' => 'AC555ZZ', 'id_tipo_maquinaria' => $t2]);
    $baja = $alta(['nombre' => 'FW-02', 'id_tipo_maquinaria' => $t1]);
    $this->actingAs($admin)->postJson("/api/v1/machinery/{$baja}/disable");

    $this->actingAs($admin)->getJson('/api/v1/machinery?q=AC555')->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Camión 2');
    $this->actingAs($admin)->getJson("/api/v1/machinery?tipo={$t1}")->assertJsonCount(1, 'data');
    $this->actingAs($admin)->getJson("/api/v1/machinery?tipo={$t1}&estado=todos")->assertJsonCount(2, 'data');
    $this->actingAs($admin)->getJson("/api/v1/machinery?frente={$prusia}")->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'FW-01');
});
