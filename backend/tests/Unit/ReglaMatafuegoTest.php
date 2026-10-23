<?php

use App\Contexts\Maintenance\Domain\EstadoMatafuego;
use App\Contexts\Maintenance\Domain\ReglaMatafuego;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

// Dominio puro: datos obligatorios por estado del matafuego (D24, specs/06)

$codigo = function (EstadoMatafuego $e, ?string $fecha, bool $ilegible = false): ?string {
    try {
        ReglaMatafuego::validar($e, $fecha, $ilegible);

        return null;
    } catch (ReglaDeNegocioException $ex) {
        return $ex->codigo;
    }
};

it('OK exige vencimiento y no admite etiqueta ilegible', function () use ($codigo) {
    expect($codigo(EstadoMatafuego::Ok, '2027-01-01'))->toBeNull()
        ->and($codigo(EstadoMatafuego::Ok, null))->toBe('VENCIMIENTO_REQUERIDO')
        ->and($codigo(EstadoMatafuego::Ok, null, true))->toBe('ETIQUETA_ILEGIBLE_NO_APLICA');
});

it('DESCARGADO y DAÑADO exigen vencimiento salvo etiqueta ilegible, y entonces va vacío', function () use ($codigo) {
    foreach ([EstadoMatafuego::Descargado, EstadoMatafuego::Danado] as $e) {
        expect($codigo($e, '2027-01-01'))->toBeNull()
            ->and($codigo($e, null))->toBe('VENCIMIENTO_REQUERIDO')
            ->and($codigo($e, null, true))->toBeNull()
            ->and($codigo($e, '2027-01-01', true))->toBe('VENCIMIENTO_CON_ETIQUETA_ILEGIBLE');
    }
});

it('FALTANTE no pide ni admite vencimiento: nunca una fecha ficticia', function () use ($codigo) {
    expect($codigo(EstadoMatafuego::Faltante, null))->toBeNull()
        ->and($codigo(EstadoMatafuego::Faltante, '2027-01-01'))->toBe('VENCIMIENTO_NO_APLICA')
        ->and($codigo(EstadoMatafuego::Faltante, null, true))->toBe('VENCIMIENTO_NO_APLICA');
});
