<?php

use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maintenance\Infrastructure\ControlMatafuegoModel;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;

// specs/06-matafuego-faltante.md (D24)

beforeEach(function () {
    $this->travelTo('2026-10-21 10:00');
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Camioneta', 'metrica' => 'KILOMETRAJE'])->id_tipo_maquinaria;
    $this->op = usuarioCon(Rol::Operario);
    $this->ct = UnidadModel::create(['nombre' => 'CT-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo, 'id_usuario' => $this->op->id_usuario])->id_unidad;
    $this->controlar = fn (array $d, array $h = []) => $this->actingAs($this->op)->postJson('/api/v1/maintenance/extinguishers', $d + ['id_unidad' => $this->ct, 'fecha_revision' => '2026-10-21'], $h);
});

it('CA-06.1: FALTANTE sin fecha se registra vacío y el panel lo marca sin calcular vencimiento', function () {
    ($this->controlar)(['estado_matafuego' => 'FALTANTE'])->assertCreated()->assertJsonPath('data.fecha_vencimiento_carga', null);
    expect(ControlMatafuegoModel::sole()->fecha_vencimiento_carga)->toBeNull();

    $this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/maintenance/panel')
        ->assertJsonPath('data.0.matafuego.estado', 'FALTANTE')
        ->assertJsonPath('data.0.matafuego.vencimiento', null)
        ->assertJsonPath('data.0.matafuego.vencido', false)
        ->assertJsonPath('data.0.matafuego.por_vencer', false);
});

it('CA-06.2: OK sin fecha se rechaza', function () {
    ($this->controlar)(['estado_matafuego' => 'OK'])->assertStatus(422)->assertJsonPath('error.code', 'VENCIMIENTO_REQUERIDO');
});

it('CA-06.3: DAÑADO con etiqueta ilegible y sin fecha se registra y el panel lo muestra', function () {
    ($this->controlar)(['estado_matafuego' => 'DANADO', 'etiqueta_ilegible' => true])->assertCreated()->assertJsonPath('data.etiqueta_ilegible', true);
    $this->actingAs(usuarioCon(Rol::Mantenimiento))->getJson('/api/v1/maintenance/panel')
        ->assertJsonPath('data.0.matafuego.etiqueta_ilegible', true)->assertJsonPath('data.0.matafuego.vencido', false);
});

it('CA-06.4: FALTANTE con fecha se rechaza para no guardar un dato sin sentido', function () {
    ($this->controlar)(['estado_matafuego' => 'FALTANTE', 'fecha_vencimiento_carga' => '2027-01-01'])->assertStatus(422)->assertJsonPath('error.code', 'VENCIMIENTO_NO_APLICA');
    expect(ControlMatafuegoModel::count())->toBe(0);
});

it('el control de matafuego también es idempotente e informa si ya estaba registrado', function () {
    $h = ['Idempotency-Key' => 'mf-1'];
    ($this->controlar)(['estado_matafuego' => 'OK', 'fecha_vencimiento_carga' => '2027-01-01'], $h)->assertCreated()->assertJsonPath('ya_registrado', false);
    ($this->controlar)(['estado_matafuego' => 'OK', 'fecha_vencimiento_carga' => '2027-01-01'], $h)->assertOk()->assertJsonPath('ya_registrado', true);
    expect(ControlMatafuegoModel::count())->toBe(1);
});
