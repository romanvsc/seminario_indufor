<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\ExternalCosts\Infrastructure\ConsumoModel;
use App\Contexts\ExternalCosts\Infrastructure\LoteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Production\Infrastructure\ProduccionModel;
use Database\Seeders\FrentesSeeder;
use Database\Seeders\TiposMaderaSeeder;

beforeEach(function () {
    $this->seed([FrentesSeeder::class, TiposMaderaSeeder::class]);
    $this->travelTo('2026-10-21 10:00');
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->hv = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo])->id_unidad;
    $enc = usuarioCon(Rol::Encargado);
    $this->ope = usuarioCon(Rol::Operario);
    $parte = fn (string $frente, string $madera, string $fecha, ?float $t, ?float $m3, ?int $operario = null) => ProduccionModel::create([
        'id_unidad' => $this->hv, 'id_usuario' => $operario ?? $enc->id_usuario, 'id_operario' => $operario, 'id_frente' => frente($frente),
        'tipo_madera' => madera($madera), 'fecha_registro' => $fecha, 'cantidad_toneladas' => $t, 'metros_cubicos' => $m3,
    ]);
    // Bordes de quincena (D10): el 15 va a la primera, el 16 a la segunda
    $parte('Papel Misionero', 'pulpable', '2026-10-15', 10, null);
    $parte('Papel Misionero', 'pulpable', '2026-10-16', 5, null);
    $parte('Papel Misionero', 'aserrable', '2026-10-01', null, 3);
    $parte('Prusia', 'aserrable', '2026-10-15', 7.25, 2, $this->ope->id_usuario);
    $parte('Prusia', 'aserrable', '2026-09-30', 99, null, $this->ope->id_usuario); // fuera de octubre
});

it('quincenal (RF14): por frente y tipo, sin mezclar maderas ni magnitudes, reproducible', function () {
    $gerencia = usuarioCon(Rol::Gerencia);
    $q1 = $this->actingAs($gerencia)->getJson('/api/v1/reports/production/fortnight?periodo=2026-10&quincena=1')->assertOk()->json('data');

    expect($q1['desde'])->toBe('2026-10-01')->and($q1['hasta'])->toBe('2026-10-15')
        ->and(collect($q1['por_frente'])->map(fn ($r) => [$r['frente'], $r['tipo_madera'], $r['toneladas'], $r['metros_cubicos']])->all())->toBe([
            ['Papel Misionero', 'aserrable', null, '3.00'],
            ['Papel Misionero', 'pulpable', '10.00', null],
            ['Prusia', 'aserrable', '7.25', '2.00'],
        ]);
    $q2 = $this->actingAs($gerencia)->getJson('/api/v1/reports/production/fortnight?periodo=2026-10&quincena=2')->json('data');
    expect($q2['por_frente'])->toHaveCount(1)->and($q2['por_frente'][0]['toneladas'])->toBe('5.00')->and($q2['en_curso'])->toBeTrue();

    $this->actingAs($gerencia)->getJson('/api/v1/reports/production/fortnight?periodo=2026-10&quincena=1')->assertJsonPath('data', $q1);
});

it('sin parámetros toma la quincena en curso', function () {
    $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/reports/production/fortnight')
        ->assertJsonPath('data.periodo', '2026-10')->assertJsonPath('data.quincena', 2);
});

it('filtros históricos (RF16) por operario, frente y fechas', function () {
    $admin = usuarioCon(Rol::Administracion);
    $r = $this->actingAs($admin)->getJson("/api/v1/reports/production?desde=2026-09-01&hasta=2026-10-31&operario={$this->ope->id_usuario}")->json('data');
    expect(collect($r['detalle'])->pluck('frente')->unique()->values()->all())->toBe(['Prusia'])
        ->and($r['por_frente'][0]['toneladas'])->toBe('106.25');

    $r = $this->actingAs($admin)->getJson('/api/v1/reports/production?desde=2026-10-16&hasta=2026-10-31&frente='.frente('Papel Misionero'))->json('data');
    expect($r['detalle'])->toHaveCount(1)->and($r['detalle'][0]['operario'])->toBeNull();
    $this->actingAs($admin)->getJson('/api/v1/reports/production?desde=2026-10-31&hasta=2026-10-01')->assertStatus(422);
});

it('mensual (RF15): período vencido con consumos importados, fecha límite el 15 y acceso auditado', function () {
    $lote = LoteModel::create(['tipo' => 'IMPORT_CONSUMOS', 'periodo' => '2026-09', 'estado' => 'OK', 'iniciado_at' => now()])->id_lote;
    ConsumoModel::create(['id_lote' => $lote, 'id_unidad' => $this->hv, 'periodo' => '2026-09', 'litros' => '412.50', 'costo_total' => '556875.00']);

    $this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/reports/monthly')
        ->assertOk()
        ->assertJsonPath('data.periodo', '2026-09')
        ->assertJsonPath('data.es_periodo_vencido', true)
        ->assertJsonPath('data.fecha_limite', '2026-10-15')
        ->assertJsonPath('data.consumos_importados', true)
        ->assertJsonPath('data.total_consumos.costo_total', '556875.00')
        ->assertJsonPath('data.produccion.0.toneladas', '99.00');

    expect(AuditoriaEventoModel::where('accion', 'reporte_financiero.consultado')->where('entidad_id', 'mensual')->exists())->toBeTrue();
    $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/reports/monthly?periodo=2026-10')
        ->assertJsonPath('data.consumos_importados', false)->assertJsonPath('data.es_periodo_vencido', false);
});

it('consumos (D09): por período y máquina; frente y operario no disponibles', function () {
    $lote = LoteModel::create(['tipo' => 'IMPORT_CONSUMOS', 'periodo' => '2026-08', 'estado' => 'OK', 'iniciado_at' => now()])->id_lote;
    ConsumoModel::create(['id_lote' => $lote, 'id_unidad' => $this->hv, 'periodo' => '2026-08', 'litros' => '100.00', 'costo_total' => '135000.00']);
    $lote2 = LoteModel::create(['tipo' => 'IMPORT_CONSUMOS', 'periodo' => '2026-09', 'estado' => 'OK', 'iniciado_at' => now()])->id_lote;
    ConsumoModel::create(['id_lote' => $lote2, 'id_unidad' => $this->hv, 'periodo' => '2026-09', 'litros' => '50.50', 'costo_total' => '68175.00']);

    $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/reports/consumption?desde=2026-08&hasta=2026-09')
        ->assertOk()->assertJsonCount(2, 'data.filas')
        ->assertJsonPath('data.totales.litros', '150.50')->assertJsonPath('data.totales.costo_total', '203175.00')
        ->assertJsonPath('data.no_disponible', ['frente', 'operario']);
    $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/reports/consumption?desde=2026-09&hasta=2026-08')
        ->assertStatus(422)->assertJsonPath('error.code', 'RANGO_INVALIDO');
});

it('permisos (RNF03): lo financiero solo para Administración y Gerencia; Mantenimiento ve el operativo', function (Rol $rol, array $esperado) {
    $u = usuarioCon($rol);
    foreach ([
        'produccion' => '/api/v1/reports/production/fortnight',
        'operativo' => '/api/v1/reports/operational?desde=2026-10-01&hasta=2026-10-31',
        'financiero' => '/api/v1/reports/monthly',
        'consumos' => '/api/v1/reports/consumption?desde=2026-09&hasta=2026-09',
        'dashboard' => '/api/v1/dashboard',
    ] as $clave => $url) {
        $this->actingAs($u)->getJson($url)->assertStatus(in_array($clave, $esperado, true) ? 200 : 403);
    }
})->with([
    'gerencia' => [Rol::Gerencia, ['produccion', 'operativo', 'financiero', 'consumos', 'dashboard']],
    'mantenimiento' => [Rol::Mantenimiento, ['operativo']],
    'encargado' => [Rol::Encargado, []],
    'operario' => [Rol::Operario, []],
    'camionero' => [Rol::Camionero, []],
    'logística' => [Rol::Logistica, []],
]);

it('dashboard: quincena en curso hasta hoy, pendientes y consumos del período vencido', function () {
    $this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/dashboard')
        ->assertOk()
        ->assertJsonPath('data.quincena.numero', 2)
        ->assertJsonPath('data.quincena.por_frente.0.toneladas', '5.00')
        ->assertJsonPath('data.consumos_vencido.periodo', '2026-09')
        ->assertJsonPath('data.operativo.unidades_activas', 1)
        ->assertJsonPath('data.operativo.unidades_sin_lectura_semana', 1)
        ->assertJsonCount(5, 'data.serie_30_dias.filas'); // 22/09 a 21/10: incluye el parte del 30/09
});
