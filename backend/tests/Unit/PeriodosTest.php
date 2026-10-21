<?php

use App\Contexts\Reporting\Domain\Periodos;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

// Dominio puro: cortes de reporte (D10)

it('quincenas: 1 al 15 y 16 a fin de mes, también en febrero bisiesto', function () {
    expect(Periodos::quincena('2026-10', 1))->toBe(['desde' => '2026-10-01', 'hasta' => '2026-10-15'])
        ->and(Periodos::quincena('2026-10', 2))->toBe(['desde' => '2026-10-16', 'hasta' => '2026-10-31'])
        ->and(Periodos::quincena('2028-02', 2))->toBe(['desde' => '2028-02-16', 'hasta' => '2028-02-29'])
        ->and(Periodos::quincena('2026-02', 2)['hasta'])->toBe('2026-02-28');
});

it('el 15 cae en la primera quincena y el 16 en la segunda', function () {
    expect(Periodos::quincenaDe('2026-10-15'))->toBe(['periodo' => '2026-10', 'numero' => 1])
        ->and(Periodos::quincenaDe('2026-10-16'))->toBe(['periodo' => '2026-10', 'numero' => 2]);
});

it('el mensual es el período vencido, incluido el cambio de año', function () {
    expect(Periodos::periodoVencido('2026-10-21'))->toBe('2026-09')
        ->and(Periodos::periodoVencido('2027-01-05'))->toBe('2026-12')
        ->and(Periodos::mes('2026-09'))->toBe(['desde' => '2026-09-01', 'hasta' => '2026-09-30']);
});

it('rechaza períodos y quincenas inválidos', function () {
    expect(fn () => Periodos::quincena('2026-13', 1))->toThrow(ReglaDeNegocioException::class)
        ->and(fn () => Periodos::quincena('2026-10', 3))->toThrow(ReglaDeNegocioException::class);
});
