<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Production\Infrastructure\ProduccionModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Database\Seeders\FrentesSeeder;
use Database\Seeders\TiposMaderaSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed([FrentesSeeder::class, TiposMaderaSeeder::class]);
    $this->travelTo('2026-10-14 10:00');
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO']);
    $this->unidad = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo->id_tipo_maquinaria])->id_unidad;
});

function frente(string $nombre): int
{
    return FrenteModel::where('nombre_frente', $nombre)->sole()->id_frente;
}

function madera(string $nombre): int
{
    return TipoMaderaModel::where('nombre', $nombre)->sole()->id_tipo_madera;
}

function asignado(Rol $rol, string $frente, string $desde = '2026-10-01', ?string $hasta = null): UsuarioModel
{
    $u = usuarioCon($rol);
    AsignacionModel::create(['id_frente' => frente($frente), 'id_usuario' => $u->id_usuario, 'fecha_desde' => $desde, 'fecha_hasta' => $hasta]);

    return $u;
}

function parte(int $unidad, string $frente, array $extra = []): array
{
    return array_merge([
        'id_frente' => frente($frente), 'id_unidad' => $unidad, 'tipo_madera' => madera('pulpable'),
        'fecha_registro' => '2026-10-14', 'cantidad_toneladas' => 32.5,
    ], $extra);
}

it('el encargado de Papel Misionero carga producción consolidada y queda trazado y auditado', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero');

    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero', ['metros_cubicos' => 40]))
        ->assertCreated()
        ->assertJsonPath('data.registrado_por.id', $enc->id_usuario)
        ->assertJsonPath('data.operario', null)
        ->assertJsonPath('data.tipo_madera.nombre', 'pulpable')
        ->assertJsonPath('data.cantidad_toneladas', '32.50')
        ->assertJsonPath('data.metros_cubicos', '40.00')
        ->json('data.id');

    expect(AuditoriaEventoModel::where('accion', 'produccion.registrada')->where('entidad_id', $id)->sole()->id_usuario)->toBe($enc->id_usuario);
});

it('el operario de Prusia carga producción individual y queda como productor', function () {
    $op = asignado(Rol::Operario, 'Prusia');

    $this->actingAs($op)->postJson('/api/v1/production', parte($this->unidad, 'Prusia', ['tipo_madera' => madera('aserrable')]))
        ->assertCreated()
        ->assertJsonPath('data.operario.id', $op->id_usuario)
        ->assertJsonPath('data.frente.modalidad', 'INDIVIDUAL');
});

it('D30: acepta una máquina que figura en otro frente y el parte queda en el frente declarado', function () {
    UnidadModel::whereKey($this->unidad)->update(['id_frente_actual' => frente('Papel Misionero')]);
    $op = asignado(Rol::Operario, 'Prusia');

    $id = $this->actingAs($op)->postJson('/api/v1/production', parte($this->unidad, 'Prusia'))
        ->assertCreated()->assertJsonPath('data.frente.id', frente('Prusia'))->json('data.id');

    // Si la máquina se mueve después, el historial del parte no cambia
    UnidadModel::whereKey($this->unidad)->update(['id_frente_actual' => frente('Bosques del Plata')]);
    expect(ProduccionModel::findOrFail($id)->id_frente)->toBe(frente('Prusia'));
});

it('rechaza la carga que no corresponde a la modalidad del frente', function () {
    $this->actingAs(asignado(Rol::Operario, 'Papel Misionero'))->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))
        ->assertStatus(422)->assertJsonPath('error.code', 'MODALIDAD_NO_PERMITIDA');
    $this->actingAs(asignado(Rol::Encargado, 'Prusia'))->postJson('/api/v1/production', parte($this->unidad, 'Prusia'))
        ->assertStatus(422)->assertJsonPath('error.code', 'MODALIDAD_NO_PERMITIDA');
});

it('rechaza al usuario que no estaba asignado al frente en la fecha del parte (D12)', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero', '2026-10-10');
    asignado(Rol::Encargado, 'Bosques del Plata'); // otro frente: no habilita Papel Misionero

    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero', ['fecha_registro' => '2026-10-05']))
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION');
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Bosques del Plata'))
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION');
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero', ['fecha_registro' => '2026-10-10']))
        ->assertCreated(); // parte atrasado dentro de la asignación
});

it('valida catálogo, magnitudes y fecha', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero');

    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero', ['tipo_madera' => 999, 'cantidad_toneladas' => -3]))
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['tipo_madera', 'cantidad_toneladas']]]);
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero', ['cantidad_toneladas' => null]))
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_MAGNITUD');
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero', ['fecha_registro' => '2026-10-15']))
        ->assertStatus(422)->assertJsonPath('error.code', 'FECHA_FUTURA');
});

it('solo encargados y operarios cargan producción', function (Rol $rol) {
    $this->actingAs(usuarioCon($rol))->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->assertForbidden();
})->with([Rol::Administracion, Rol::Gerencia, Rol::Camionero, Rol::Logistica, Rol::Mantenimiento]);

it('encargados y operarios ven solo sus frentes en la fecha; administración y gerencia ven todo', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero');
    $op = asignado(Rol::Operario, 'Prusia');
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->assertCreated();
    $idPrusia = $this->actingAs($op)->postJson('/api/v1/production', parte($this->unidad, 'Prusia'))->assertCreated()->json('data.id');

    $this->actingAs($enc)->getJson('/api/v1/production')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.frente.nombre', 'Papel Misionero');
    $this->actingAs($enc)->getJson("/api/v1/production/{$idPrusia}")->assertForbidden();
    $this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/production')->assertJsonCount(2, 'data');
    $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/production?frente='.frente('Prusia'))->assertJsonCount(1, 'data');
    $this->actingAs(usuarioCon(Rol::Logistica))->getJson('/api/v1/production')->assertForbidden();
});

it('solo quien registró corrige su parte, con auditoría antes/después', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero');
    $otro = asignado(Rol::Encargado, 'Papel Misionero');
    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->json('data.id');

    $this->actingAs($otro)->putJson("/api/v1/production/{$id}", ['cantidad_toneladas' => 1, 'motivo' => 'No es mío'])->assertForbidden();
    $this->actingAs($enc)->putJson("/api/v1/production/{$id}", ['cantidad_toneladas' => 30, 'observaciones' => 'Corrección de planilla', 'motivo' => 'Toneladas mal transcriptas'])
        ->assertOk()->assertJsonPath('data.cantidad_toneladas', '30.00')->assertJsonPath('data.registrado_por.id', $enc->id_usuario);
    $this->actingAs($enc)->putJson("/api/v1/production/{$id}", ['cantidad_toneladas' => null, 'motivo' => 'Prueba sin magnitud'])
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_MAGNITUD');

    $evento = AuditoriaEventoModel::where('accion', 'produccion.corregida')->sole();
    expect($evento->before_json['cantidad_toneladas'])->toBe('32.50')->and($evento->after_json['cantidad_toneladas'])->toBe('30.00');
});

it('D25 / CA-03.1: la corrección exige motivo y lo deja en la auditoría', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero');
    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->json('data.id');

    $this->actingAs($enc)->putJson("/api/v1/production/{$id}", ['cantidad_toneladas' => 30])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['motivo']]]);
    $this->actingAs($enc)->putJson("/api/v1/production/{$id}", ['cantidad_toneladas' => 30, 'motivo' => 'ok'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['motivo']]]);
    expect(ProduccionModel::findOrFail($id)->cantidad_toneladas)->toBe('32.50');

    $this->actingAs($enc)->putJson("/api/v1/production/{$id}", ['cantidad_toneladas' => 30, 'motivo' => '  Toneladas invertidas en la planilla  '])->assertOk();
    expect(AuditoriaEventoModel::where('accion', 'produccion.corregida')->sole()->after_json)
        ->toMatchArray(['cantidad_toneladas' => '30.00', 'motivo' => 'Toneladas invertidas en la planilla']);
});

it('CA-03.3: corregir la jornada a una fecha sin asignación se rechaza junto al campo y no cambia el parte', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero', '2026-10-10');
    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->json('data.id');

    $this->actingAs($enc)->putJson("/api/v1/production/{$id}", ['fecha_registro' => '2026-10-05', 'motivo' => 'La jornada era otra'])
        ->assertStatus(422)->assertJsonPath('error.code', 'SIN_ASIGNACION')->assertJsonStructure(['error' => ['details' => ['id_frente']]]);
    expect(ProduccionModel::findOrFail($id)->fecha_registro->format('Y-m-d'))->toBe('2026-10-14');
});

it('lista los tipos de madera habilitados', function () {
    $this->actingAs(usuarioCon(Rol::Operario))->getJson('/api/v1/wood-types')
        ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('data.0.nombre', 'aserrable');
});

it('el autor adjunta una foto de respaldo (RF04), queda privada, auditada y la ve quien puede ver el parte', function () {
    Storage::fake('local');
    $enc = asignado(Rol::Encargado, 'Papel Misionero');
    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->assertJsonPath('data.tiene_foto', false)->json('data.id');

    $this->actingAs($enc)->post("/api/v1/production/{$id}/photo", ['foto' => UploadedFile::fake()->image('planilla.jpg')], ['Accept' => 'application/json'])
        ->assertOk()->assertJsonPath('data.tiene_foto', true);

    $ruta = AuditoriaEventoModel::where('accion', 'produccion.foto_adjuntada')->sole()->after_json['foto_soporte'];
    Storage::disk('local')->assertExists($ruta);
    expect($ruta)->toStartWith("produccion/{$id}/");

    $this->actingAs(usuarioCon(Rol::Gerencia))->get("/api/v1/production/{$id}/photo")->assertOk();
    $this->actingAs(asignado(Rol::Operario, 'Prusia'))->getJson("/api/v1/production/{$id}/photo")->assertForbidden();
});

it('rechaza archivos que no son imagen y fotos de partes ajenos; sin foto el parte es válido', function () {
    Storage::fake('local');
    $enc = asignado(Rol::Encargado, 'Papel Misionero');
    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'))->assertCreated()->json('data.id');

    $this->actingAs($enc)->post("/api/v1/production/{$id}/photo", ['foto' => UploadedFile::fake()->create('planilla.pdf', 100, 'application/pdf')], ['Accept' => 'application/json'])
        ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['foto']]]);
    $this->actingAs(asignado(Rol::Encargado, 'Papel Misionero'))->post("/api/v1/production/{$id}/photo", ['foto' => UploadedFile::fake()->image('x.jpg')], ['Accept' => 'application/json'])
        ->assertForbidden();
    $this->actingAs($enc)->getJson("/api/v1/production/{$id}/photo")->assertNotFound();
});

it('un reintento con la misma clave de idempotencia no duplica el parte', function () {
    $enc = asignado(Rol::Encargado, 'Papel Misionero');
    $headers = ['Idempotency-Key' => 'parte-abc-123'];

    $id = $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'), $headers)->assertCreated()->json('data.id');
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'), $headers)->assertOk()->assertJsonPath('data.id', $id);
    $this->actingAs($enc)->postJson('/api/v1/production', parte($this->unidad, 'Papel Misionero'), ['Idempotency-Key' => 'otra'])->assertCreated();

    expect(ProduccionModel::count())->toBe(2);
});
