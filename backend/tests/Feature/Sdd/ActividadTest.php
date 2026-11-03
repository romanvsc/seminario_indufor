<?php

use App\Contexts\Audit\Infrastructure\AuditoriaEventoModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;

// Inicio, actividad reciente (P2): solo acciones operativas; toda la operación con audit.view, si no solo lo propio
beforeEach(function () {
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->hv = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo])->id_unidad;
    $this->evento = fn (?int $usuario, string $accion, array $despues = [], string $cuando = '2026-10-21 10:00:00') => AuditoriaEventoModel::create([
        'id_usuario' => $usuario, 'bounded_context' => 'x', 'accion' => $accion, 'entidad' => 'x', 'entidad_id' => '7', 'after_json' => $despues, 'created_at' => $cuando,
    ]);
});

it('el personal de campo ve solo su actividad operativa, con el contexto de la unidad', function () {
    $op = usuarioCon(Rol::Operario);
    $otro = usuarioCon(Rol::Operario);
    ($this->evento)($op->id_usuario, 'lectura.registrada', ['id_unidad' => $this->hv], '2026-10-21 10:24:00');
    ($this->evento)($otro->id_usuario, 'lectura.registrada', ['id_unidad' => $this->hv]);
    ($this->evento)($op->id_usuario, 'usuario.actualizado'); // no operativa: no se muestra

    $this->actingAs($op)->getJson('/api/v1/me/activity')->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.accion', 'lectura.registrada')
        ->assertJsonPath('data.0.contexto', 'HV-01')
        ->assertJsonPath('data.0.fecha', '2026-10-21 10:24');
});

it('administración ve la de todos, ordenada de la más reciente, sin acciones de usuarios ni consultas financieras', function () {
    $op = usuarioCon(Rol::Operario);
    ($this->evento)($op->id_usuario, 'viaje.declarado', ['destino' => 'Planta Puerto Esperanza'], '2026-10-20 09:00:00');
    ($this->evento)(null, 'consumos.importados', ['periodo' => '2026-09'], '2026-10-21 08:00:00');
    ($this->evento)($op->id_usuario, 'reporte_financiero.consultado');

    $data = $this->actingAs(usuarioCon(Rol::Administracion))->getJson('/api/v1/me/activity')->assertOk()->json('data');
    expect(array_column($data, 'accion'))->toBe(['consumos.importados', 'viaje.declarado'])
        ->and($data[0])->toMatchArray(['usuario' => 'Sistema', 'contexto' => 'Período 2026-09'])
        ->and($data[1]['contexto'])->toBe('Planta Puerto Esperanza');
});
