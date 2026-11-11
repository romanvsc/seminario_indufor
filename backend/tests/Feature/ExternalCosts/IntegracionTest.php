<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\ExternalCosts\Application\Ports\ExportadorLecturas;
use App\Contexts\ExternalCosts\Infrastructure\ConsumoModel;
use App\Contexts\ExternalCosts\Infrastructure\LoteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    $this->travelTo('2026-10-21 10:00');
    $km = TipoMaquinariaModel::create(['nombre' => 'Camión', 'metrica' => 'KILOMETRAJE'])->id_tipo_maquinaria;
    $horas = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->operario = usuarioCon(Rol::Operario);
    // El operario es el responsable: puede cargarles lecturas (D28)
    $this->camion = UnidadModel::create(['nombre' => 'Camión 1', 'dominio_patente' => 'AB123CD', 'marca_modelo' => 'Scania', 'id_tipo_maquinaria' => $km, 'id_usuario' => $this->operario->id_usuario])->id_unidad;
    $this->harvester = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'Ponsse', 'id_tipo_maquinaria' => $horas, 'id_usuario' => $this->operario->id_usuario])->id_unidad;
    $this->admin = usuarioCon(Rol::Administracion);
});

function csvConsumos(array $filas, string $nombre = 'consumos.csv'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($nombre, "periodo,codigo_unidad,litros,costo_total,referencia_externa\n".implode("\n", $filas)."\n");
}

// ── RF12: exportación automática ─────────────────────────────────────────────

it('una lectura válida se exporta sola al sistema externo en CSV v1', function () {
    $id = $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $this->camion, 'fecha_lectura' => '2026-10-20T08:00', 'kilometraje_actual' => 85000, 'tiene_falla' => false])
        ->assertCreated()->json('data.id');

    Storage::disk('local')->assertExists("integracion/salida/lectura-{$id}.csv");
    expect(Storage::disk('local')->get("integracion/salida/lectura-{$id}.csv"))
        ->toBe("version,id_lectura,codigo_unidad,fecha_lectura,metrica,valor\n1,{$id},AB123CD,2026-10-20 08:00:00,KILOMETRAJE,85000\n")
        ->and(LoteModel::where('tipo', 'EXPORT_LECTURAS')->sole()->only(['estado', 'nombre_archivo', 'id_usuario']))
        ->toBe(['estado' => 'OK', 'nombre_archivo' => "lectura-{$id}.csv", 'id_usuario' => null]);
});

it('la máquina sin patente se identifica como INT-<id>; la lectura sin valor no se exporta', function () {
    $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $this->harvester, 'fecha_lectura' => '2026-10-20T08:00', 'horometro_actual' => 1250.5, 'tiene_falla' => false]);
    $sinValor = $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $this->harvester, 'fecha_lectura' => '2026-10-21T08:00', 'tiene_falla' => true, 'detalle_falla' => 'Display roto'])->json('data.id');

    expect(Storage::disk('local')->get('integracion/salida/'.LoteModel::sole()->nombre_archivo))->toContain(",INT-{$this->harvester},")
        ->and(Storage::disk('local')->exists("integracion/salida/lectura-{$sinValor}.csv"))->toBeFalse();
});

it('si el envío falla, la lectura queda guardada y pendiente; el reintento la exporta una sola vez', function () {
    app()->instance(ExportadorLecturas::class, new class implements ExportadorLecturas
    {
        public function exportar(array $lectura): array
        {
            throw new RuntimeException('Buzón del sistema externo no disponible');
        }
    });
    $id = $this->actingAs($this->operario)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $this->camion, 'fecha_lectura' => '2026-10-20T08:00', 'kilometraje_actual' => 85000, 'tiene_falla' => false])
        ->assertCreated()->json('data.id');

    expect(LecturaModel::whereKey($id)->exists())->toBeTrue()
        ->and(LoteModel::sole()->only(['estado', 'detalle_error']))->toBe(['estado' => 'ERROR', 'detalle_error' => 'Buzón del sistema externo no disponible']);
    $this->actingAs($this->admin)->getJson('/api/v1/integrations/batches')->assertJsonPath('pendientes_exportacion', 1);

    app()->forgetInstance(ExportadorLecturas::class);
    $this->actingAs($this->admin)->postJson('/api/v1/integrations/exports/retry')->assertOk()->assertJsonPath('data', ['exportadas' => 1, 'con_error' => 0]);
    $this->actingAs($this->admin)->postJson('/api/v1/integrations/exports/retry')->assertJsonPath('data', ['exportadas' => 0, 'con_error' => 0]);
    expect(LoteModel::where('estado', 'OK')->count())->toBe(1);
    Storage::disk('local')->assertExists("integracion/salida/lectura-{$id}.csv");
});

// ── RF13: importación idempotente ────────────────────────────────────────────

it('importa el consolidado; el mismo archivo otra vez no duplica nada', function () {
    $archivo = fn () => csvConsumos(['2026-09,AB123CD,412.50,556875.00,LIQ-1', "2026-09,INT-{$this->harvester},880.00,1188000.00,LIQ-2"]);

    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => $archivo(), 'periodo' => '2026-09'], ['Accept' => 'application/json'])
        ->assertCreated()->assertJsonPath('data.estado', 'OK')->assertJsonPath('data.consumos', 2)->assertJsonPath('ya_importado', false);
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => $archivo(), 'periodo' => '2026-09'], ['Accept' => 'application/json'])
        ->assertOk()->assertJsonPath('ya_importado', true);

    expect(ConsumoModel::count())->toBe(2)
        ->and(LoteModel::where('tipo', 'IMPORT_CONSUMOS')->count())->toBe(1);
    $this->actingAs($this->admin)->getJson('/api/v1/integrations/consumptions?periodo=2026-09')
        ->assertJsonPath('totales.litros', '1292.50')->assertJsonPath('totales.costo_total', '1744875.00');
});

it('otro archivo del mismo período se rechaza; solo lo reemplaza una acción explícita con motivo, auditada', function () {
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos(['2026-09,AB123CD,412.50,556875.00,LIQ-1']), 'periodo' => '2026-09'], ['Accept' => 'application/json'])->assertCreated();
    $corregido = fn () => csvConsumos(['2026-09,AB123CD,400.00,540000.00,LIQ-1b'], 'consumos-corregido.csv');

    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => $corregido(), 'periodo' => '2026-09'], ['Accept' => 'application/json'])
        ->assertStatus(422)->assertJsonPath('error.code', 'PERIODO_YA_IMPORTADO');
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => $corregido(), 'periodo' => '2026-09', 'reemplazar' => true], ['Accept' => 'application/json'])
        ->assertStatus(422)->assertJsonPath('error.code', 'MOTIVO_REQUERIDO');
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => $corregido(), 'periodo' => '2026-09', 'reemplazar' => true, 'motivo' => 'El sistema externo corrigió los litros'], ['Accept' => 'application/json'])
        ->assertCreated();

    expect(ConsumoModel::sole()->litros)->toBe('400.00')
        ->and(LoteModel::where('tipo', 'IMPORT_CONSUMOS')->orderBy('id_lote')->pluck('estado')->all())->toBe(['REEMPLAZADO', 'OK'])
        ->and(AuditoriaEventoModel::where('accion', 'consumos.reemplazados')->sole()->after_json['motivo'])->toBe('El sistema externo corrigió los litros');
});

it('falla parcial: las filas con error quedan detalladas y las válidas se importan', function () {
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos([
        '2026-09,AB123CD,412.50,556875.00,LIQ-1',
        '2026-09,ZZ999ZZ,10.00,13500.00,LIQ-2',
        '2026-09,AB123CD,1.00,1350.00,LIQ-3',
    ]), 'periodo' => '2026-09'], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.estado', 'PARCIAL')
        ->assertJsonPath('data.consumos', 1)
        ->assertJsonPath('data.errores.0.fila', 3)
        ->assertJsonPath('data.errores.1.fila', 4);
});

it('un archivo sin filas válidas no borra el consolidado anterior aunque se pida reemplazar (D21: queda RECHAZADO)', function () {
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos(['2026-09,AB123CD,412.50,556875.00,LIQ-1']), 'periodo' => '2026-09'], ['Accept' => 'application/json'])->assertCreated();
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos(['2026-09,NOEXISTE,1.00,1.00,X'], 'malo.csv'), 'periodo' => '2026-09', 'reemplazar' => true, 'motivo' => 'Prueba de reemplazo'], ['Accept' => 'application/json'])
        ->assertStatus(422)->assertJsonPath('error.code', 'REEMPLAZO_CON_ERRORES');

    expect(ConsumoModel::sole()->litros)->toBe('412.50')
        ->and(LoteModel::where('tipo', 'IMPORT_CONSUMOS')->orderBy('id_lote')->pluck('estado')->all())->toBe(['OK', 'RECHAZADO']);
});

// specs/01-integridad-consumos.md (D21)

it('CA-01.1: un reemplazo con alguna fila inválida no se aplica; la unidad que estaba bien conserva su consumo', function () {
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos([
        '2026-09,AB123CD,412.50,556875.00,LIQ-1', "2026-09,INT-{$this->harvester},880.00,1188000.00,LIQ-2",
    ]), 'periodo' => '2026-09'], ['Accept' => 'application/json'])->assertCreated();
    $vigente = LoteModel::where('estado', 'OK')->sole()->id_lote;

    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos([
        '2026-09,AB123CD,400.00,540000.00,LIQ-1b', "2026-09,INT-{$this->harvester},abc,1.00,LIQ-2b",
    ], 'corregido.csv'), 'periodo' => '2026-09', 'reemplazar' => true, 'motivo' => 'Corrección del sistema externo'], ['Accept' => 'application/json'])
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'REEMPLAZO_CON_ERRORES')
        ->assertJsonPath('error.details.filas.0', 'Fila 3: Litros inválidos: «abc».');

    expect(ConsumoModel::where('periodo', '2026-09')->orderBy('id_unidad')->pluck('litros')->all())->toBe(['412.50', '880.00'])
        ->and(ConsumoModel::pluck('id_lote')->unique()->values()->all())->toBe([$vigente])
        ->and(LoteModel::find($vigente)->estado)->toBe('OK')
        ->and(LoteModel::where('estado', 'RECHAZADO')->sole()->nombre_archivo)->toBe('corregido.csv')
        ->and(AuditoriaEventoModel::where('accion', 'consumos.reemplazo_rechazado')->exists())->toBeTrue();
});

it('CA-01.5: un reemplazo sin errores se aplica entero: los consumos pertenecen solo al lote nuevo', function () {
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos([
        '2026-09,AB123CD,412.50,556875.00,LIQ-1', "2026-09,INT-{$this->harvester},880.00,1188000.00,LIQ-2",
    ]), 'periodo' => '2026-09'], ['Accept' => 'application/json'])->assertCreated();
    $nuevo = $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos(['2026-09,AB123CD,400.00,540000.00,LIQ-1b'], 'corregido.csv'),
        'periodo' => '2026-09', 'reemplazar' => true, 'motivo' => 'Corrección del sistema externo'], ['Accept' => 'application/json'])
        ->assertCreated()->assertJsonPath('data.estado', 'OK')->json('data.id');

    expect(ConsumoModel::pluck('id_lote')->unique()->values()->all())->toBe([$nuevo])
        ->and(AuditoriaEventoModel::where('accion', 'consumos.reemplazados')->sole()->before_json['consumos'])->toBe(2);
});

it('rechaza un archivo que no respeta el contrato', function () {
    $malo = UploadedFile::fake()->createWithContent('x.csv', "unidad;litros\nAB123CD;10\n");
    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => $malo, 'periodo' => '2026-09'], ['Accept' => 'application/json'])
        ->assertStatus(422)->assertJsonPath('error.code', 'FORMATO_INVALIDO');
    expect(LoteModel::count())->toBe(0);
});

it('el simulador genera un consolidado que se importa completo', function () {
    $csv = $this->actingAs($this->admin)->get('/api/v1/integrations/simulator/consumptions?periodo=2026-09')
        ->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8')->getContent();

    $this->actingAs($this->admin)->post('/api/v1/integrations/imports', ['archivo' => UploadedFile::fake()->createWithContent('sim.csv', $csv), 'periodo' => '2026-09'], ['Accept' => 'application/json'])
        ->assertCreated()->assertJsonPath('data.estado', 'OK')->assertJsonPath('data.consumos', 2);
});

it('solo Administración importa, reintenta y ve el historial', function (Rol $rol) {
    $u = usuarioCon($rol);
    $this->actingAs($u)->getJson('/api/v1/integrations/batches')->assertForbidden();
    $this->actingAs($u)->postJson('/api/v1/integrations/exports/retry')->assertForbidden();
    $this->actingAs($u)->post('/api/v1/integrations/imports', ['archivo' => csvConsumos([]), 'periodo' => '2026-09'], ['Accept' => 'application/json'])->assertForbidden();
})->with([Rol::Gerencia, Rol::Encargado, Rol::Operario, Rol::Camionero, Rol::Logistica, Rol::Mantenimiento]);

it('CA-08.2: con 35 lotes el historial se recorre entero por páginas', function () {
    foreach (range(1, 35) as $i) {
        LoteModel::create(['tipo' => 'EXPORT_LECTURAS', 'estado' => 'OK', 'iniciado_at' => now()->subMinutes($i), 'finalizado_at' => now()->subMinutes($i)]);
    }

    $this->actingAs($this->admin)->getJson('/api/v1/integrations/batches')
        ->assertJsonCount(30, 'data')->assertJsonPath('meta.last_page', 2)->assertJsonPath('meta.total', 35);
    $this->actingAs($this->admin)->getJson('/api/v1/integrations/batches?page=2')
        ->assertJsonCount(5, 'data')->assertJsonPath('meta.current_page', 2);
});
