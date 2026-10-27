<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Database\Seeders\FrentesSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->seed(FrentesSeeder::class);
    $this->travelTo('2026-10-21 10:00'); // miércoles: el corte semanal fue el lunes 19
    $horas = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $km = TipoMaquinariaModel::create(['nombre' => 'Camioneta', 'metrica' => 'KILOMETRAJE'])->id_tipo_maquinaria;
    $this->operario = usuarioCon(Rol::Operario);
    // D28: carga en HV-01 por su asignación a Prusia y en CT-01 (sin frente) por ser su responsable
    AsignacionModel::create(['id_frente' => frente('Prusia'), 'id_usuario' => $this->operario->id_usuario, 'fecha_desde' => '2026-10-01']);
    $this->harvester = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'Ponsse', 'id_tipo_maquinaria' => $horas, 'id_frente_actual' => frente('Prusia')])->id_unidad;
    $this->camioneta = UnidadModel::create(['nombre' => 'CT-01', 'marca_modelo' => 'Hilux', 'id_tipo_maquinaria' => $km, 'id_usuario' => $this->operario->id_usuario])->id_unidad;
});

function lectura(int $unidad, array $extra = []): array
{
    return array_merge(['id_unidad' => $unidad, 'fecha_lectura' => '2026-10-20T08:00', 'horometro_actual' => 1250.5, 'tiene_falla' => false], $extra);
}

it('registra una lectura válida, auditada, y la siguiente no puede ser menor (RNF05)', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester))
        ->assertCreated()->assertJsonPath('data.horometro_actual', '1250.50')->assertJsonPath('data.operario.id', $this->operario->id_usuario);

    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-21T08:00', 'horometro_actual' => 1205.5]))
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'LECTURA_REGRESIVA')
        ->assertJsonPath('error.details.horometro_actual.0', 'La lectura anterior fue 1250.50 h (20/10/2026 08:00). Revisá si los números están invertidos.');

    expect(LecturaModel::count())->toBe(1)
        ->and(AuditoriaEventoModel::where('accion', 'lectura.registrada')->count())->toBe(1);
});

it('la validación bloquea la unidad antes de leer la lectura anterior (dos cargas simultáneas se validan de a una)', function () {
    $sql = [];
    DB::listen(function ($q) use (&$sql) {
        $sql[] = strtolower($q->sql);
    });
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester))->assertCreated();

    $bloqueo = collect($sql)->search(fn ($s) => str_contains($s, 'from `maquinaria`') && str_contains($s, 'for update'));
    $vecina = collect($sql)->search(fn ($s) => str_contains($s, 'from `lectura_mantenimiento`'));
    expect($bloqueo)->not->toBeFalse()->and($bloqueo)->toBeLessThan($vecina);
});

it('una lectura atrasada debe quedar entre la anterior y la posterior (D08)', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-13T08:00', 'horometro_actual' => 1100]))->assertCreated();
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-20T08:00', 'horometro_actual' => 1250]))->assertCreated();

    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-16T08:00', 'horometro_actual' => 1300]))
        ->assertStatus(422)->assertJsonPath('error.code', 'LECTURA_REGRESIVA');
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-16T08:00', 'horometro_actual' => 1180]))->assertCreated();
});

it('la unidad decide la métrica: kilometraje en la camioneta, horómetro en la forestal', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->camioneta))
        ->assertStatus(422)->assertJsonPath('error.code', 'METRICA_INCORRECTA');
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->camioneta, ['horometro_actual' => null, 'kilometraje_actual' => 85000]))
        ->assertCreated()->assertJsonPath('data.kilometraje_actual', 85000);
    $this->actingAs($this->operario)->getJson("/api/v1/maintenance/units/{$this->camioneta}/last-reading")
        ->assertOk()->assertJsonPath('data.metrica', 'KILOMETRAJE')->assertJsonPath('data.anterior.valor', '85000');
});

it('falla de punta a punta (RF10): sin detalle se rechaza; con detalle queda abierta, Mantenimiento la ve y la atiende', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['tiene_falla' => true]))
        ->assertStatus(422)->assertJsonPath('error.code', 'FALLA_SIN_DETALLE');
    $id = $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['tiene_falla' => true, 'detalle_falla' => 'Display del horómetro roto', 'horometro_actual' => null]))
        ->assertCreated()->json('data.id');
    expect(AuditoriaEventoModel::where('accion', 'falla.reportada')->where('entidad_id', $id)->exists())->toBeTrue();

    $man = usuarioCon(Rol::Mantenimiento);
    $this->actingAs($man)->getJson('/api/v1/maintenance/failures')->assertJsonCount(1, 'data')->assertJsonPath('data.0.detalle_falla', 'Display del horómetro roto');
    $panel = collect($this->actingAs($man)->getJson('/api/v1/maintenance/panel')->json('data'))->keyBy('unidad.nombre');
    expect($panel['HV-01']['fallas_abiertas'])->toBe(1)->and($panel['CT-01']['fallas_abiertas'])->toBe(0);
    $this->actingAs(usuarioCon(Rol::Administracion))->postJson("/api/v1/maintenance/failures/{$id}/attend", ['nota' => 'x y z'])->assertForbidden();

    $this->actingAs($man)->postJson("/api/v1/maintenance/failures/{$id}/attend", ['nota' => 'Se cambió el display'])
        ->assertOk()->assertJsonPath('data.atencion.por.id', $man->id_usuario);
    $this->actingAs($man)->postJson("/api/v1/maintenance/failures/{$id}/attend", ['nota' => 'Otra vez'])
        ->assertStatus(422)->assertJsonPath('error.code', 'FALLA_ATENDIDA');
    $this->actingAs($man)->getJson('/api/v1/maintenance/failures')->assertJsonCount(0, 'data');
    $this->actingAs($man)->getJson('/api/v1/maintenance/failures?estado=atendidas')->assertJsonCount(1, 'data');
    expect(AuditoriaEventoModel::where('accion', 'falla.atendida')->sole()->after_json['nota_atencion'])->toBe('Se cambió el display');
});

it('permisos: cargan encargados y operarios; ven por frente o todo según el rol', function () {
    $this->actingAs(usuarioCon(Rol::Camionero))->postJson('/api/v1/maintenance/readings', lectura($this->harvester))->assertForbidden();
    $this->actingAs(usuarioCon(Rol::Mantenimiento))->postJson('/api/v1/maintenance/readings', lectura($this->harvester))->assertForbidden();
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester))->assertCreated();

    $otro = usuarioCon(Rol::Encargado);
    $this->actingAs($otro)->getJson('/api/v1/maintenance/readings')->assertJsonCount(0, 'data'); // no está en Prusia
    AsignacionModel::create(['id_frente' => frente('Prusia'), 'id_usuario' => $otro->id_usuario, 'fecha_desde' => '2026-10-01']);
    $this->actingAs($otro)->getJson('/api/v1/maintenance/readings')->assertJsonCount(1, 'data');
    $this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/maintenance/readings')->assertJsonCount(1, 'data');
    $this->actingAs(usuarioCon(Rol::Logistica))->getJson('/api/v1/maintenance/readings')->assertForbidden();
    $this->actingAs($this->operario)->getJson('/api/v1/maintenance/panel')->assertForbidden();
});

it('D28: no se carga ni se consulta la referencia de una unidad de otro frente', function () {
    $enc = usuarioCon(Rol::Encargado);
    AsignacionModel::create(['id_frente' => frente('Papel Misionero'), 'id_usuario' => $enc->id_usuario, 'fecha_desde' => '2026-10-01']);

    $this->actingAs($enc)->postJson('/api/v1/maintenance/readings', lectura($this->harvester))
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION')->assertJsonStructure(['error' => ['details' => ['id_unidad']]]);
    $this->actingAs($enc)->postJson('/api/v1/maintenance/extinguishers', ['id_unidad' => $this->harvester, 'estado_matafuego' => 'OK', 'fecha_revision' => '2026-10-21', 'fecha_vencimiento_carga' => '2027-01-01'])
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION');
    $this->actingAs($enc)->getJson("/api/v1/maintenance/units/{$this->harvester}/last-reading")->assertForbidden();
    // CT-01 no tiene frente y su responsable es otro usuario
    $this->actingAs($enc)->postJson('/api/v1/maintenance/readings', lectura($this->camioneta, ['horometro_actual' => null, 'kilometraje_actual' => 1000]))
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION');

    expect(LecturaModel::count())->toBe(0)
        ->and(AuditoriaEventoModel::where('accion', 'matafuego.controlado')->count())->toBe(0);
});

it('D28: la asignación se mira en la fecha de la lectura, no hoy', function () {
    $op = usuarioCon(Rol::Operario);
    AsignacionModel::create(['id_frente' => frente('Prusia'), 'id_usuario' => $op->id_usuario, 'fecha_desde' => '2026-10-01', 'fecha_hasta' => '2026-10-15']);

    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-14T08:00']))->assertCreated();
    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-20T08:00', 'horometro_actual' => 1300]))
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION');
    $this->actingAs($op)->getJson("/api/v1/maintenance/units/{$this->harvester}/last-reading?fecha=2026-10-14T09:00")->assertOk();
    $this->actingAs($op)->getJson("/api/v1/maintenance/units/{$this->harvester}/last-reading")->assertForbidden();
});

it('control mensual de matafuegos (RF11): estados fijos, auditado y visible en el panel con su vencimiento', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/extinguishers', ['id_unidad' => $this->harvester, 'estado_matafuego' => 'ROTO', 'fecha_revision' => '2026-10-21', 'fecha_vencimiento_carga' => '2027-01-01'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['estado_matafuego']]]);
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/extinguishers', ['id_unidad' => $this->harvester, 'estado_matafuego' => 'OK', 'fecha_revision' => '2026-10-22', 'fecha_vencimiento_carga' => '2027-01-01'])
        ->assertStatus(422)->assertJsonPath('error.code', 'FECHA_FUTURA');
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/extinguishers', ['id_unidad' => $this->harvester, 'estado_matafuego' => 'OK', 'fecha_revision' => '2026-10-21', 'fecha_vencimiento_carga' => '2026-11-10'])
        ->assertCreated()->assertJsonPath('data.estado', 'OK');
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/extinguishers', ['id_unidad' => $this->camioneta, 'estado_matafuego' => 'DESCARGADO', 'fecha_revision' => '2026-09-15', 'fecha_vencimiento_carga' => '2026-10-01'])->assertCreated();
    expect(AuditoriaEventoModel::where('accion', 'matafuego.controlado')->count())->toBe(2);

    $panel = collect($this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/maintenance/panel')->assertOk()->json('data'))->keyBy('unidad.nombre');
    expect($panel['HV-01']['matafuego'])->toMatchArray(['control_del_mes' => true, 'vencido' => false, 'por_vencer' => true])
        ->and($panel['CT-01']['matafuego'])->toMatchArray(['estado' => 'DESCARGADO', 'control_del_mes' => false, 'vencido' => true]);
    $this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/maintenance/extinguishers')->assertJsonCount(2, 'data');
    $this->actingAs($this->operario)->getJson('/api/v1/maintenance/extinguishers')->assertForbidden();
});

it('el panel marca qué unidades tienen lectura desde el lunes (corte semanal RF09)', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->harvester, ['fecha_lectura' => '2026-10-19T07:00']))->assertCreated();
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', lectura($this->camioneta, ['horometro_actual' => null, 'kilometraje_actual' => 1000, 'fecha_lectura' => '2026-10-18T07:00']))->assertCreated();

    $panel = collect($this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/maintenance/panel')->json('data'))->keyBy('unidad.nombre');
    expect($panel['HV-01']['lectura_semana'])->toBeTrue()
        ->and($panel['CT-01']['lectura_semana'])->toBeFalse()
        ->and($panel['HV-01']['ultima_lectura']['valor'])->toBe('1250.50');
});
