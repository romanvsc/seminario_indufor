<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use Database\Seeders\FrentesSeeder;

beforeEach(fn () => $this->seed(FrentesSeeder::class));

$frente = fn (string $nombre) => FrenteModel::where('nombre_frente', $nombre)->sole()->id_frente;

it('siembra los tres frentes con su modalidad (D04)', function () {
    $this->actingAs(usuarioCon(Rol::Camionero))->getJson('/api/v1/fronts')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.nombre', 'Bosques del Plata')
        ->assertJsonPath('data.0.modalidad', 'CONSOLIDADA')
        ->assertJsonPath('data.2.nombre', 'Prusia')
        ->assertJsonPath('data.2.modalidad', 'INDIVIDUAL');
});

it('administración crea, modifica y deshabilita frentes, y queda auditado', function () {
    $admin = usuarioCon(Rol::Administracion);
    $id = $this->actingAs($admin)->postJson('/api/v1/fronts', ['nombre_frente' => 'Nuevo', 'modalidad_produccion' => 'INDIVIDUAL'])
        ->assertCreated()->json('data.id');

    $this->actingAs($admin)->putJson("/api/v1/fronts/{$id}", ['nombre_frente' => 'Nuevo Norte', 'ubicacion_geografica' => 'Misiones', 'modalidad_produccion' => 'INDIVIDUAL'])
        ->assertOk()->assertJsonPath('data.ubicacion', 'Misiones');
    $this->actingAs($admin)->postJson("/api/v1/fronts/{$id}/disable")->assertOk()->assertJsonPath('data.estado_activo', false);

    expect(AuditoriaEventoModel::where('entidad_id', $id)->where('entidad', 'frente_trabajo')->pluck('accion')->all())
        ->toBe(['frente.creado', 'frente.actualizado', 'frente.deshabilitado']);
});

it('rechaza nombre repetido y modalidad inexistente', function () {
    $this->actingAs(usuarioCon(Rol::Administracion))->postJson('/api/v1/fronts', ['nombre_frente' => 'Prusia', 'modalidad_produccion' => 'MIXTA'])
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['nombre_frente', 'modalidad_produccion']]]);
});

it('solo administración gestiona frentes y asigna usuarios (backend, no solo UI)', function (Rol $rol) use ($frente) {
    $u = usuarioCon($rol);
    $this->actingAs($u)->postJson('/api/v1/fronts', ['nombre_frente' => 'X', 'modalidad_produccion' => 'INDIVIDUAL'])->assertForbidden();
    $this->actingAs($u)->postJson("/api/v1/fronts/{$frente('Prusia')}/disable")->assertForbidden();
    $this->actingAs($u)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $u->id_usuario, 'fecha_desde' => '2026-10-01'])
        ->assertForbidden()->assertJsonPath('error.code', 'SIN_PERMISO');
})->with([Rol::Gerencia, Rol::Encargado, Rol::Operario, Rol::Camionero, Rol::Logistica, Rol::Mantenimiento]);

it('sin sesión no hay acceso a frentes', function () {
    $this->getJson('/api/v1/fronts')->assertUnauthorized();
});

it('asigna un usuario a un frente con historial y auditoría', function () use ($frente) {
    $admin = usuarioCon(Rol::Administracion);
    $op = usuarioCon(Rol::Operario);

    $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $op->id_usuario, 'fecha_desde' => '2026-10-01'])
        ->assertCreated()
        ->assertJsonPath('data.frente.nombre', 'Prusia')
        ->assertJsonPath('data.usuario.id', $op->id_usuario)
        ->assertJsonPath('data.fecha_hasta', null);

    expect(AuditoriaEventoModel::where('accion', 'asignacion.creada')->sole()->after_json)
        ->toMatchArray(['id_usuario' => $op->id_usuario, 'fecha_desde' => '2026-10-01']);
});

it('valida fechas: fin anterior al inicio y formato', function () use ($frente) {
    $admin = usuarioCon(Rol::Administracion);
    $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $admin->id_usuario, 'fecha_desde' => '2026-10-10', 'fecha_hasta' => '2026-10-09'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['fecha_hasta']]]);
    $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $admin->id_usuario, 'fecha_desde' => '10/10/2026'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['fecha_desde']]]);
});

it('no permite asignar a un frente o usuario deshabilitado', function () use ($frente) {
    $admin = usuarioCon(Rol::Administracion);
    $op = usuarioCon(Rol::Operario);
    $op->update(['estado_activo' => false]);
    FrenteModel::whereKey($frente('Prusia'))->update(['estado_activo' => false]);

    $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $op->id_usuario, 'fecha_desde' => '2026-10-01'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['id_frente', 'id_usuario']]]);
});

it('rechaza asignaciones superpuestas del mismo usuario al mismo frente (D17)', function () use ($frente) {
    $admin = usuarioCon(Rol::Administracion);
    $op = usuarioCon(Rol::Operario);
    $asignar = fn (string $frenteNombre, string $desde, ?string $hasta = null) => $this->actingAs($admin)->postJson('/api/v1/front-assignments', [
        'id_frente' => $frente($frenteNombre), 'id_usuario' => $op->id_usuario, 'fecha_desde' => $desde, 'fecha_hasta' => $hasta,
    ]);

    $asignar('Prusia', '2026-10-01', '2026-10-15')->assertCreated();
    $asignar('Prusia', '2026-10-15')->assertStatus(422)->assertJsonPath('error.code', 'ASIGNACION_SUPERPUESTA');
    $asignar('Prusia', '2026-09-01', '2026-10-01')->assertStatus(422);
    $asignar('Prusia', '2026-10-16')->assertCreated();
    $asignar('Prusia', '2026-12-01')->assertStatus(422); // la anterior sigue abierta
    $asignar('Papel Misionero', '2026-10-05')->assertCreated(); // otro frente, en paralelo
});

it('finaliza una asignación una sola vez y nunca antes de su inicio', function () use ($frente) {
    $admin = usuarioCon(Rol::Administracion);
    $id = $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $admin->id_usuario, 'fecha_desde' => '2026-10-01'])->json('data.id');

    $this->actingAs($admin)->postJson("/api/v1/front-assignments/{$id}/end", ['fecha_hasta' => '2026-09-30'])
        ->assertStatus(422)->assertJsonPath('error.code', 'FECHA_HASTA_INVALIDA');
    $this->actingAs($admin)->postJson("/api/v1/front-assignments/{$id}/end", ['fecha_hasta' => '2026-10-20'])
        ->assertOk()->assertJsonPath('data.fecha_hasta', '2026-10-20');
    $this->actingAs($admin)->postJson("/api/v1/front-assignments/{$id}/end", ['fecha_hasta' => '2026-10-25'])
        ->assertStatus(422)->assertJsonPath('error.code', 'ASIGNACION_FINALIZADA');

    $evento = AuditoriaEventoModel::where('accion', 'asignacion.finalizada')->sole();
    expect($evento->before_json['fecha_hasta'])->toBeNull()->and($evento->after_json['fecha_hasta'])->toBe('2026-10-20');
});

it('filtra asignaciones vigentes a hoy, por frente y por usuario', function () use ($frente) {
    $this->travelTo('2026-10-13 10:00');
    $admin = usuarioCon(Rol::Administracion);
    $op = usuarioCon(Rol::Operario);
    $post = fn (string $f, string $d, ?string $h = null) => $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente($f), 'id_usuario' => $op->id_usuario, 'fecha_desde' => $d, 'fecha_hasta' => $h])->assertCreated();
    $post('Prusia', '2026-09-01', '2026-09-30');
    $post('Prusia', '2026-10-01');
    $post('Papel Misionero', '2026-11-01');

    $this->actingAs($admin)->getJson("/api/v1/front-assignments?usuario={$op->id_usuario}")->assertJsonCount(3, 'data');
    $this->actingAs($admin)->getJson("/api/v1/front-assignments?usuario={$op->id_usuario}&vigentes=1")
        ->assertJsonCount(1, 'data')->assertJsonPath('data.0.fecha_desde', '2026-10-01');
    $this->actingAs($admin)->getJson("/api/v1/front-assignments?frente={$frente('Papel Misionero')}")->assertJsonCount(1, 'data');
});

it('D29: el historial de asignaciones de otros solo lo ven Administración y Gerencia', function () use ($frente) {
    $admin = usuarioCon(Rol::Administracion);
    $op = usuarioCon(Rol::Operario);
    $enc = usuarioCon(Rol::Encargado);
    foreach ([$op, $enc] as $u) {
        $this->actingAs($admin)->postJson('/api/v1/front-assignments', ['id_frente' => $frente('Prusia'), 'id_usuario' => $u->id_usuario, 'fecha_desde' => '2026-10-01'])->assertCreated();
    }

    // Campo: pedir las de otro es 403; sin filtro, o filtrando por frente, solo ve las propias
    $this->actingAs($enc)->getJson("/api/v1/front-assignments?usuario={$op->id_usuario}")->assertForbidden();
    $this->actingAs($op)->getJson('/api/v1/front-assignments')->assertJsonCount(1, 'data')->assertJsonPath('data.0.usuario.id', $op->id_usuario);
    $this->actingAs($enc)->getJson("/api/v1/front-assignments?frente={$frente('Prusia')}")->assertJsonCount(1, 'data')->assertJsonPath('data.0.usuario.id', $enc->id_usuario);
    $this->actingAs($enc)->getJson("/api/v1/front-assignments?usuario={$enc->id_usuario}")->assertOk()->assertJsonCount(1, 'data');
    foreach ([Rol::Camionero, Rol::Logistica, Rol::Mantenimiento] as $rol) {
        $this->actingAs(usuarioCon($rol))->getJson('/api/v1/front-assignments')->assertOk()->assertJsonCount(0, 'data');
    }

    // Administración y Gerencia ven todo el historial
    $this->actingAs($admin)->getJson("/api/v1/front-assignments?frente={$frente('Prusia')}")->assertJsonCount(2, 'data');
    $this->actingAs(usuarioCon(Rol::Gerencia))->getJson("/api/v1/front-assignments?usuario={$op->id_usuario}")->assertOk()->assertJsonCount(1, 'data');
});
