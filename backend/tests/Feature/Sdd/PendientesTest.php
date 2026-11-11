<?php

use App\Contexts\ExternalCosts\Infrastructure\LoteModel;
use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Logistics\Infrastructure\ViajeModel;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Database\Seeders\FrentesSeeder;
use Database\Seeders\TiposMaderaSeeder;

// Spec 07 (T-07.1, D26) y rediseño del inicio: cada pendiente aparece solo con su permiso, con cantidad y contexto
beforeEach(function () {
    $this->seed([FrentesSeeder::class, TiposMaderaSeeder::class]);
    $this->travelTo('2026-10-21 10:00'); // miércoles; corte semanal el lunes 19
    $this->prusia = FrenteModel::where('nombre_frente', 'Prusia')->sole()->id_frente;
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->hv1 = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo, 'id_frente_actual' => $this->prusia])->id_unidad;
    $this->hv2 = UnidadModel::create(['nombre' => 'HV-02', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo, 'id_frente_actual' => $this->prusia])->id_unidad;
});

it('operario: unidades de su frente sin lectura desde el lunes, identificadas; nada de logística ni administración', function () {
    $op = usuarioCon(Rol::Operario);
    AsignacionModel::create(['id_frente' => $this->prusia, 'id_usuario' => $op->id_usuario, 'fecha_desde' => '2026-10-01']);
    LecturaModel::create(['id_unidad' => $this->hv1, 'id_operario_reporte' => $op->id_usuario, 'fecha_lectura' => '2026-10-20 08:00:00', 'horometro_actual' => 100, 'tiene_falla' => false]);

    $r = $this->actingAs($op)->getJson('/api/v1/me/pending')->assertOk();
    expect(array_keys($r->json('data')))->toBe(['unidades_sin_lectura_semana'])
        ->and($r->json('data.unidades_sin_lectura_semana'))->toBe(['cantidad' => 1, 'items' => [['id' => $this->hv2, 'nombre' => 'HV-02', 'frente' => 'Prusia']]])
        ->and($r->json('meta.generado_at'))->toBe('2026-10-21 10:00:00');

    // Sin asignación ni unidades a cargo, no hay nada que leer
    expect($this->actingAs(usuarioCon(Rol::Operario))->getJson('/api/v1/me/pending')->json('data.unidades_sin_lectura_semana.cantidad'))->toBe(0);
});

it('camionero ve sus viajes por estado con el más antiguo; administración, los viajes sin remito con origen y camionero', function () {
    $cam = usuarioCon(Rol::Camionero);
    $otro = usuarioCon(Rol::Camionero);
    $viaje = fn ($u, string $estado, string $fecha) => ViajeModel::create([
        'id_unidad_camion' => $this->hv1, 'id_usuario_camionero' => $u->id_usuario, 'id_frente_origen' => $this->prusia, 'fecha' => $fecha,
        'destino' => 'Planta', 'tipo_madera' => TipoMaderaModel::value('id_tipo_madera'), 'volumen_declarado' => 30, 'estado_validacion' => $estado,
    ]);
    $viaje($cam, 'PENDIENTE', '2026-10-20 08:00:00');
    $enCorreccion = $viaje($cam, 'CORRECCION_SOLICITADA', '2026-10-19 07:00:00');
    $viaje($otro, 'PENDIENTE', '2026-10-18 09:30:00');

    $mio = $this->actingAs($cam)->getJson('/api/v1/me/pending')->json('data');
    expect(array_keys($mio))->toBe(['mis_viajes_pendientes', 'mis_viajes_en_correccion'])
        ->and($mio['mis_viajes_en_correccion'])->toBe(['cantidad' => 1, 'items' => [['id' => $enCorreccion->id_viaje, 'fecha' => '2026-10-19 07:00', 'destino' => 'Planta']]]);

    $adm = $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/me/pending')->json('data');
    expect($adm)->toHaveKeys(['viajes_sin_remito', 'correcciones_abiertas', 'lecturas_sin_exportar', 'consumos_periodo_vencido', 'fallas_abiertas', 'matafuegos_vencidos'])
        ->and($adm['viajes_sin_remito']['cantidad'])->toBe(2)
        ->and($adm['viajes_sin_remito']['items'][0])->toMatchArray(['fecha' => '2026-10-18 09:30', 'origen' => 'Prusia']);
    expect($adm)->not->toHaveKey('unidades_sin_lectura_semana')->not->toHaveKey('mis_viajes_pendientes');
});

it('consolidado del período vencido: distingue no importado, importado con filas con error y plazo vencido (lote vigente, D21)', function () {
    $adm = usuarioCon(Rol::Administracion);
    $consumos = fn () => $this->actingAs($adm)->getJson('/api/v1/me/pending')->json('data.consumos_periodo_vencido');

    // 21/10: el período vencido es 2026-09 y vence el 15/10
    expect($consumos())->toMatchArray(['periodo' => '2026-09', 'fecha_limite' => '2026-10-15', 'plazo_vencido' => true, 'lote' => null]);

    LoteModel::create(['tipo' => 'IMPORT_CONSUMOS', 'periodo' => '2026-09', 'estado' => 'PARCIAL', 'iniciado_at' => now(), 'finalizado_at' => now(),
        'detalle_error' => json_encode([['fila' => 3, 'mensaje' => 'Unidad desconocida'], ['fila' => 7, 'mensaje' => 'Litros inválidos']])]);
    expect($consumos()['lote'])->toMatchArray(['estado' => 'PARCIAL', 'filas_con_error' => 2]);

    // Antes del día 15, el mismo período sin importar está en plazo
    $this->travelTo('2026-10-10 10:00');
    LoteModel::query()->delete();
    expect($consumos())->toMatchArray(['plazo_vencido' => false, 'lote' => null]);
});

it('mantenimiento: fallas abiertas con unidad y fecha, y matafuegos vencidos según el último control', function () {
    $op = usuarioCon(Rol::Operario);
    LecturaModel::create(['id_unidad' => $this->hv1, 'id_operario_reporte' => $op->id_usuario, 'fecha_lectura' => '2026-10-20 08:00:00', 'tiene_falla' => true, 'detalle_falla' => 'Display']);
    $control = fn (int $u, string $rev, ?string $venc) => ControlMatafuegoModel::create(['id_unidad' => $u, 'id_operario' => $op->id_usuario, 'estado_matafuego' => 'OK', 'fecha_revision' => $rev, 'fecha_vencimiento_carga' => $venc, 'etiqueta_ilegible' => false]);
    $control($this->hv1, '2026-09-01', '2026-10-01');
    $control($this->hv1, '2026-10-15', '2027-10-01'); // el último control lo renovó
    $control($this->hv2, '2026-10-15', '2026-10-20');

    $data = $this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/me/pending')->json('data');
    expect(array_keys($data))->toBe(['fallas_abiertas', 'matafuegos_vencidos'])
        ->and($data['fallas_abiertas']['cantidad'])->toBe(1)
        ->and($data['fallas_abiertas']['items'][0])->toMatchArray(['unidad' => 'HV-01', 'frente' => 'Prusia', 'fecha' => '2026-10-20 08:00', 'detalle' => 'Display'])
        ->and($data['matafuegos_vencidos'])->toBe(['cantidad' => 1, 'items' => [['id' => $this->hv2, 'nombre' => 'HV-02', 'vencimiento' => '2026-10-20']]]);
});

it('gerencia no tiene pendientes operativos que atender, salvo fallas para su consulta', function () {
    $data = $this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/me/pending')->assertOk()->json('data');
    expect(array_keys($data))->toBe(['fallas_abiertas', 'matafuegos_vencidos']);
});
