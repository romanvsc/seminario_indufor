<?php

use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;

// specs/08-consultas-historial.md H-08.1 — una falla sin valor no pisa el último valor conocido

it('CA-08.1: el panel muestra el último valor y avisa de la carga posterior sin valor', function () {
    $this->travelTo('2026-10-21 10:00');
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $op = usuarioCon(Rol::Operario);
    $hv = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo, 'id_usuario' => $op->id_usuario])->id_unidad;
    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $hv, 'fecha_lectura' => '2026-10-19T08:00', 'horometro_actual' => 1200, 'tiene_falla' => false])->assertCreated();
    $this->actingAs($op)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $hv, 'fecha_lectura' => '2026-10-20T08:00', 'tiene_falla' => true, 'detalle_falla' => 'Display roto'])->assertCreated();

    $this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/maintenance/panel')
        ->assertJsonPath('data.0.ultima_lectura.valor', '1200.00')
        ->assertJsonPath('data.0.ultima_lectura.fecha', '2026-10-19 08:00')
        ->assertJsonPath('data.0.ultima_carga_sin_valor', '2026-10-20 08:00')
        ->assertJsonPath('data.0.lectura_semana', true);
});
