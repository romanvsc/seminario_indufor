<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Logistics\Infrastructure\SolicitudModel;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Database\Seeders\FrentesSeeder;
use Database\Seeders\TiposMaderaSeeder;

beforeEach(function () {
    $this->seed([FrentesSeeder::class, TiposMaderaSeeder::class]);
    $this->travelTo('2026-10-19 15:00');
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Camión', 'metrica' => 'KILOMETRAJE']);
    $this->camion = UnidadModel::create(['nombre' => 'Camión 1', 'marca_modelo' => 'Scania', 'id_tipo_maquinaria' => $tipo->id_tipo_maquinaria])->id_unidad;
    $this->camionero = usuarioCon(Rol::Camionero);
    $this->admin = usuarioCon(Rol::Administracion);
});

function declaracion(int $camion, array $extra = []): array
{
    return array_merge([
        'id_unidad_camion' => $camion, 'id_frente_origen' => frente('Papel Misionero'), 'fecha' => '2026-10-19T08:30',
        'destino' => 'Planta Puerto Esperanza', 'tipo_madera' => madera('pulpable'), 'volumen_declarado' => 30,
    ], $extra);
}

function remitoPara(int $idViaje, int $transportista, array $extra = []): array
{
    return array_merge([
        'numero_remito' => "R-{$idViaje}", 'id_viaje' => $idViaje, 'fecha_remito' => '2026-10-19',
        'id_transportista' => $transportista, 'tipo_madera_remito' => madera('pulpable'), 'volumen_toneladas_remito' => '30.00',
    ], $extra);
}

it('el camionero declara un viaje y nace PENDIENTE, auditado', function () {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))
        ->assertCreated()
        ->assertJsonPath('data.estado', 'PENDIENTE')
        ->assertJsonPath('data.camionero.id', $this->camionero->id_usuario)
        ->assertJsonPath('data.volumen_declarado', '30.00')
        ->assertJsonPath('data.remito', null)
        ->json('data.id');

    expect(AuditoriaEventoModel::where('accion', 'viaje.declarado')->where('entidad_id', $id)->exists())->toBeTrue();
});

it('solo Papel Misionero y Prusia son origen (RF05); volumen > 0 y fecha no futura', function () {
    $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion, ['id_frente_origen' => frente('Bosques del Plata')]))
        ->assertStatus(422)->assertJsonPath('error.code', 'ORIGEN_NO_HABILITADO');
    $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion, ['id_frente_origen' => frente('Prusia')]))->assertCreated();
    $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion, ['volumen_declarado' => 0]))
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['volumen_declarado']]]);
    $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion, ['fecha' => '2026-10-19T18:00']))
        ->assertStatus(422)->assertJsonPath('error.code', 'FECHA_FUTURA');
});

it('remito idéntico → VALIDADO automáticamente (RF07)', function () {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');

    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario, ['volumen_toneladas_remito' => '30']))
        ->assertCreated()
        ->assertJsonPath('data.estado', 'VALIDADO')
        ->assertJsonPath('data.remito.numero', "R-{$id}")
        ->assertJsonPath('cotejo.coincide', true);

    expect(SolicitudModel::count())->toBe(0)
        ->and(AuditoriaEventoModel::where('accion', 'viaje.validado')->where('entidad_id', $id)->exists())->toBeTrue();
});

it('cada incongruencia genera CORRECCION_SOLICITADA con su detalle (RF08)', function (callable $remito, string $detalle) {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');

    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', $remito($id, $this))
        ->assertCreated()
        ->assertJsonPath('data.estado', 'CORRECCION_SOLICITADA')
        ->assertJsonPath('cotejo.coincide', false)
        ->assertJsonPath('data.solicitud_abierta.estado', 'PENDIENTE');

    expect(SolicitudModel::where('id_viaje', $id)->sole()->detalle_diferencias)->toContain($detalle);
})->with([
    'volumen' => [fn ($id, $t) => remitoPara($id, $t->camionero->id_usuario, ['volumen_toneladas_remito' => '30.01']), 'Volumen: declarado 30.00 t, remito 30.01 t.'],
    'tipo de madera' => [fn ($id, $t) => remitoPara($id, $t->camionero->id_usuario, ['tipo_madera_remito' => madera('aserrable')]), 'Tipo de madera: declarado pulpable, remito aserrable.'],
    'transportista' => [fn ($id, $t) => remitoPara($id, usuarioCon(Rol::Camionero)->id_usuario), 'Transportista:'],
]);

it('no hay forma de validar sin remito ni de cargar dos remitos para un viaje', function () {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');
    $this->actingAs($this->admin)->putJson("/api/v1/logistics/trips/{$id}", ['estado' => 'VALIDADO'])->assertStatus(405);
    $this->actingAs($this->admin)->postJson("/api/v1/logistics/trips/{$id}/validate")->assertNotFound();
    expect(ViajeModel::find($id)->estado_validacion)->toBe('PENDIENTE');

    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario))->assertCreated();
    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario, ['numero_remito' => 'OTRO']))
        ->assertStatus(422)->assertJsonPath('error.code', 'VIAJE_CON_REMITO');

    $otro = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');
    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', remitoPara($otro, $this->camionero->id_usuario, ['numero_remito' => "R-{$id}"]))
        ->assertStatus(422)->assertJsonPath('error.code', 'REMITO_DUPLICADO');
});

it('permisos: el camionero ve solo lo suyo; logística ve todo sin cargar remitos; nadie más declara', function () {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');
    $otro = usuarioCon(Rol::Camionero);
    $this->actingAs($otro)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->assertCreated();

    $this->actingAs($this->camionero)->getJson('/api/v1/logistics/trips')->assertJsonCount(1, 'data');
    $this->actingAs($otro)->getJson("/api/v1/logistics/trips/{$id}")->assertForbidden();
    $this->actingAs(usuarioCon(Rol::Logistica))->getJson('/api/v1/logistics/trips')->assertJsonCount(2, 'data');
    $this->actingAs(usuarioCon(Rol::Logistica))->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario))->assertForbidden();
    $this->actingAs(usuarioCon(Rol::Gerencia))->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario))->assertForbidden();
    $this->actingAs(usuarioCon(Rol::Encargado))->getJson('/api/v1/logistics/trips')->assertForbidden();
    $this->actingAs($this->admin)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->assertForbidden();
    $this->actingAs($this->camionero)->getJson('/api/v1/logistics/corrections')->assertForbidden();
});

it('corrección completa (D19): tomar, corregir el remito con motivo y recotejar a VALIDADO, todo auditado', function () {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');
    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario, ['volumen_toneladas_remito' => '3.00']));
    $sol = SolicitudModel::where('id_viaje', $id)->sole()->id_solicitud;

    $this->actingAs($this->admin)->getJson('/api/v1/logistics/corrections')->assertJsonCount(1, 'data')->assertJsonPath('data.0.viaje.id', $id);
    $this->actingAs($this->admin)->postJson("/api/v1/logistics/corrections/{$sol}/review")->assertOk()->assertJsonPath('data.estado', 'EN_REVISION');
    $this->actingAs($this->admin)->postJson("/api/v1/logistics/corrections/{$sol}/resolve", ['motivo' => 'Error de tipeo al cargar el remito', 'remito' => ['volumen_toneladas_remito' => 30]])
        ->assertOk()->assertJsonPath('data.estado', 'VALIDADO')->assertJsonPath('cotejo.coincide', true);

    expect(SolicitudModel::find($sol)->estado)->toBe('RESUELTA');
    $corr = AuditoriaEventoModel::where('accion', 'remito.corregido')->sole();
    expect($corr->before_json['volumen_toneladas_remito'])->toBe('3.00')
        ->and($corr->after_json['volumen_toneladas_remito'])->toBe('30.00')
        ->and($corr->after_json['motivo'])->toBe('Error de tipeo al cargar el remito');
    $this->actingAs($this->admin)->postJson("/api/v1/logistics/corrections/{$sol}/resolve", ['motivo' => 'Otra vez', 'remito' => ['volumen_toneladas_remito' => 31]])
        ->assertStatus(422)->assertJsonPath('error.code', 'SOLICITUD_RESUELTA');
});

it('si la corrección no alcanza, el recotejo abre una nueva solicitud; corregir la declaración queda auditado', function () {
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion))->json('data.id');
    $this->actingAs($this->admin)->postJson('/api/v1/logistics/remitos', remitoPara($id, $this->camionero->id_usuario, ['volumen_toneladas_remito' => '28.00', 'tipo_madera_remito' => madera('aserrable')]));
    $sol = SolicitudModel::where('id_viaje', $id)->sole()->id_solicitud;

    $this->actingAs($this->admin)->postJson("/api/v1/logistics/corrections/{$sol}/resolve", ['motivo' => 'Sin cambios reales'])
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_CAMBIOS');
    $this->actingAs($this->admin)->postJson("/api/v1/logistics/corrections/{$sol}/resolve", ['motivo' => 'El camionero confirmó 28 t', 'viaje' => ['volumen_declarado' => 28]])
        ->assertOk()->assertJsonPath('data.estado', 'CORRECCION_SOLICITADA')->assertJsonPath('cotejo.diferencias.0', 'Tipo de madera: declarado pulpable, remito aserrable.');

    expect(SolicitudModel::where('id_viaje', $id)->pluck('estado')->sort()->values()->all())->toBe(['PENDIENTE', 'RESUELTA'])
        ->and(AuditoriaEventoModel::where('accion', 'viaje.declaracion_corregida')->sole()->before_json['volumen_declarado'])->toBe('30.00');
});

it('un reintento con la misma clave de idempotencia no duplica el viaje', function () {
    $h = ['Idempotency-Key' => 'viaje-1'];
    $id = $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion), $h)->assertCreated()->json('data.id');
    $this->actingAs($this->camionero)->postJson('/api/v1/logistics/trips', declaracion($this->camion), $h)->assertOk()->assertJsonPath('data.id', $id);
    expect(ViajeModel::count())->toBe(1);
});
