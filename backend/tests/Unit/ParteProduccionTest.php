<?php

use App\Contexts\Frentes\Domain\ModalidadProduccion;
use App\Contexts\Production\Domain\ParteProduccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

// Dominio puro: reglas del parte diario (RF01–RF03, D03, D04, D18)

$validar = fn (array $c = []) => ParteProduccion::validar(...array_merge([
    'modalidad' => ModalidadProduccion::Consolidada,
    'registranteEsEncargado' => true,
    'registranteEsOperario' => false,
    'idRegistrante' => 1,
    'idOperario' => null,
    'toneladas' => '25.50',
    'metrosCubicos' => null,
    'fecha' => '2026-10-14',
    'hoy' => '2026-10-14',
], $c));

$codigo = function (callable $f): ?string {
    try {
        $f();

        return null;
    } catch (ReglaDeNegocioException $e) {
        return $e->codigo;
    }
};

it('acepta un parte consolidado del encargado con una sola magnitud', function () use ($validar, $codigo) {
    expect($codigo(fn () => $validar()))->toBeNull()
        ->and($codigo(fn () => $validar(['toneladas' => null, 'metrosCubicos' => '10'])))->toBeNull();
});

it('exige al menos una magnitud y ninguna negativa (D03)', function () use ($validar, $codigo) {
    expect($codigo(fn () => $validar(['toneladas' => null])))->toBe('SIN_MAGNITUD')
        ->and($codigo(fn () => $validar(['metrosCubicos' => '-1'])))->toBe('MAGNITUD_NEGATIVA');
});

it('rechaza una jornada futura', function () use ($validar, $codigo) {
    expect($codigo(fn () => $validar(['fecha' => '2026-10-15'])))->toBe('FECHA_FUTURA');
});

it('respeta la modalidad del frente (D04, D18)', function () use ($validar, $codigo) {
    $individual = ['modalidad' => ModalidadProduccion::Individual, 'registranteEsEncargado' => false, 'registranteEsOperario' => true];

    expect($codigo(fn () => $validar(['registranteEsEncargado' => false, 'registranteEsOperario' => true])))->toBe('MODALIDAD_NO_PERMITIDA')
        ->and($codigo(fn () => $validar([...$individual, 'idOperario' => 1])))->toBeNull()
        ->and($codigo(fn () => $validar([...$individual, 'idOperario' => 2])))->toBe('MODALIDAD_NO_PERMITIDA')
        ->and($codigo(fn () => $validar([...$individual, 'registranteEsOperario' => false, 'registranteEsEncargado' => true, 'idOperario' => 1])))->toBe('MODALIDAD_NO_PERMITIDA');
});
