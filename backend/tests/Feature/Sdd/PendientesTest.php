<?php

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

// Spec 07 (T-07.1, D26): cada conteo aparece solo con el permiso que lo habilita
beforeEach(function () {
    $this->seed([FrentesSeeder::class, TiposMaderaSeeder::class]);
    $this->travelTo('2026-10-21 10:00'); // miércoles; corte semanal el lunes 19
    $this->prusia = FrenteModel::where('nombre_frente', 'Prusia')->sole()->id_frente;
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->hv1 = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo, 'id_frente_actual' => $this->prusia])->id_unidad;
    $this->hv2 = UnidadModel::create(['nombre' => 'HV-02', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo, 'id_frente_actual' => $this->prusia])->id_unidad;
});

it('operario: unidades de su frente sin lectura desde el lunes; nada de logística ni administración', function () {
    $op = usuarioCon(Rol::Operario);
    AsignacionModel::create(['id_frente' => $this->prusia, 'id_usuario' => $op->id_usuario, 'fecha_desde' => '2026-10-01']);
    LecturaModel::create(['id_unidad' => $this->hv1, 'id_operario_reporte' => $op->id_usuario, 'fecha_lectura' => '2026-10-20 08:00:00', 'horometro_actual' => 100, 'tiene_falla' => false]);

    $data = $this->actingAs($op)->getJson('/api/v1/me/pending')->assertOk()->json('data');
    expect($data)->toBe(['unidades_sin_lectura_semana' => 1]);

    // Sin asignación ni unidades a cargo, no hay nada que leer
    expect($this->actingAs(usuarioCon(Rol::Operario))->getJson('/api/v1/me/pending')->json('data'))->toBe(['unidades_sin_lectura_semana' => 0]);
});

it('camionero ve sus viajes pendientes y en corrección; administración, los viajes sin remito y lo de integración', function () {
    $cam = usuarioCon(Rol::Camionero);
    $otro = usuarioCon(Rol::Camionero);
    $viaje = fn ($u, string $estado) => ViajeModel::create([
        'id_unidad_camion' => $this->hv1, 'id_usuario_camionero' => $u->id_usuario, 'id_frente_origen' => $this->prusia, 'fecha' => '2026-10-20 08:00:00',
        'destino' => 'Planta', 'tipo_madera' => TipoMaderaModel::value('id_tipo_madera'), 'volumen_declarado' => 30, 'estado_validacion' => $estado,
    ]);
    $viaje($cam, 'PENDIENTE');
    $viaje($cam, 'CORRECCION_SOLICITADA');
    $viaje($otro, 'PENDIENTE');

    expect($this->actingAs($cam)->getJson('/api/v1/me/pending')->json('data'))->toBe(['mis_viajes_pendientes' => 1, 'mis_viajes_en_correccion' => 1]);

    $adm = $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/me/pending')->json('data');
    expect($adm)->toHaveKeys(['viajes_sin_remito', 'correcciones_abiertas', 'lecturas_sin_exportar', 'consumos_periodo_vencido', 'fallas_abiertas', 'matafuegos_vencidos'])
        ->and($adm['viajes_sin_remito'])->toBe(2)
        ->and($adm['consumos_periodo_vencido'])->toBe(['periodo' => '2026-09', 'importado' => false]);
    expect($adm)->not->toHaveKey('unidades_sin_lectura_semana')->not->toHaveKey('mis_viajes_pendientes');
});

it('mantenimiento: fallas abiertas y matafuegos con la carga vencida según el último control', function () {
    $op = usuarioCon(Rol::Operario);
    LecturaModel::create(['id_unidad' => $this->hv1, 'id_operario_reporte' => $op->id_usuario, 'fecha_lectura' => '2026-10-20 08:00:00', 'tiene_falla' => true, 'detalle_falla' => 'Display']);
    $control = fn (int $u, string $rev, ?string $venc) => ControlMatafuegoModel::create(['id_unidad' => $u, 'id_operario' => $op->id_usuario, 'estado_matafuego' => 'OK', 'fecha_revision' => $rev, 'fecha_vencimiento_carga' => $venc, 'etiqueta_ilegible' => false]);
    $control($this->hv1, '2026-09-01', '2026-10-01');
    $control($this->hv1, '2026-10-15', '2027-10-01'); // el último control lo renovó
    $control($this->hv2, '2026-10-15', '2026-10-20');

    $data = $this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/me/pending')->json('data');
    expect($data)->toBe(['fallas_abiertas' => 1, 'matafuegos_vencidos' => 1]);
});

it('gerencia no tiene pendientes operativos que atender, salvo fallas para su consulta', function () {
    $data = $this->actingAs(usuarioCon(Rol::Gerencia))->getJson('/api/v1/me/pending')->assertOk()->json('data');
    expect(array_keys($data))->toBe(['fallas_abiertas', 'matafuegos_vencidos']);
});
