<?php

use App\Contexts\Frentes\Infrastructure\AsignacionModel;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Domain\Rol;
use App\Contexts\Maquinaria\Infrastructure\TipoMaquinariaModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Database\Seeders\FrentesSeeder;

// specs/02-cargas-atrasadas.md — la fecha ingresada decide las referencias (D08, D12)

beforeEach(function () {
    $this->seed(FrentesSeeder::class);
    $this->travelTo('2026-10-21 10:00'); // miércoles
    $tipo = TipoMaquinariaModel::create(['nombre' => 'Harvester', 'metrica' => 'HOROMETRO'])->id_tipo_maquinaria;
    $this->hv = UnidadModel::create(['nombre' => 'HV-01', 'marca_modelo' => 'X', 'id_tipo_maquinaria' => $tipo])->id_unidad;
    $this->op = usuarioCon(Rol::Operario);
    $leer = fn (string $fecha, float $h) => $this->actingAs($this->op)->postJson('/api/v1/maintenance/readings', ['id_unidad' => $this->hv, 'fecha_lectura' => $fecha, 'horometro_actual' => $h, 'tiene_falla' => false]);
    $leer('2026-10-19T08:00', 100)->assertCreated(); // lunes
    $leer('2026-10-21T08:00', 120)->assertCreated(); // miércoles
    $this->leer = $leer;
});

it('CA-02.1 / CA-02.2 / CA-02.3: last-reading devuelve las vecinas de la fecha pedida, no la última', function () {
    $this->actingAs($this->op)->getJson("/api/v1/maintenance/units/{$this->hv}/last-reading?fecha=2026-10-20T08:00")
        ->assertOk()
        ->assertJsonPath('data.anterior.valor', '100.00')
        ->assertJsonPath('data.posterior.valor', '120.00');
    // Sin fecha se comporta como antes: la última hasta ahora y sin posterior
    $this->actingAs($this->op)->getJson("/api/v1/maintenance/units/{$this->hv}/last-reading")
        ->assertJsonPath('data.anterior.valor', '120.00')->assertJsonPath('data.posterior', null);
});

it('caso obligatorio: 110 h del martes se acepta y 130 h se rechaza', function () {
    ($this->leer)('2026-10-20T08:00', 130)->assertStatus(422)->assertJsonPath('error.code', 'LECTURA_REGRESIVA');
    ($this->leer)('2026-10-20T08:00', 90)->assertStatus(422)->assertJsonPath('error.code', 'LECTURA_REGRESIVA');
    ($this->leer)('2026-10-20T08:00', 110)->assertCreated();
});

it('CA-02.4 / CA-02.5: las asignaciones se piden por la fecha del parte', function () {
    $enc = usuarioCon(Rol::Encargado);
    $id = fn (string $n) => FrenteModel::where('nombre_frente', $n)->sole()->id_frente;
    AsignacionModel::create(['id_frente' => $id('Papel Misionero'), 'id_usuario' => $enc->id_usuario, 'fecha_desde' => '2026-10-01', 'fecha_hasta' => '2026-10-15']);
    AsignacionModel::create(['id_frente' => $id('Bosques del Plata'), 'id_usuario' => $enc->id_usuario, 'fecha_desde' => '2026-10-16']);

    $this->actingAs($enc)->getJson("/api/v1/front-assignments?usuario={$enc->id_usuario}&fecha=2026-10-10")
        ->assertJsonCount(1, 'data')->assertJsonPath('data.0.frente.nombre', 'Papel Misionero');
    $this->actingAs($enc)->getJson("/api/v1/front-assignments?usuario={$enc->id_usuario}&fecha=2026-10-20")
        ->assertJsonCount(1, 'data')->assertJsonPath('data.0.frente.nombre', 'Bosques del Plata');
    $this->actingAs($enc)->getJson("/api/v1/front-assignments?usuario={$enc->id_usuario}&vigentes=1")
        ->assertJsonPath('data.0.frente.nombre', 'Bosques del Plata'); // compatibilidad: vigentes = hoy
    $this->actingAs($enc)->getJson('/api/v1/front-assignments?fecha=10/10/2026')->assertStatus(422);
});
