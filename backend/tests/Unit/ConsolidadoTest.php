<?php

use App\Contexts\ExternalCosts\Domain\Consolidado;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

// Dominio puro: clasificación del consolidado mensual (RF13, D13). No conoce el CSV.

$linea = fn (int $fila, string $codigo, array $extra = []) => array_merge(
    ['fila' => $fila, 'periodo' => '2026-09', 'codigo_unidad' => $codigo, 'litros' => '412.50', 'costo_total' => '535950.00', 'referencia' => null], $extra,
);
$mapa = fn (string $c) => ['AB123CD' => 1, 'INT-2' => 2][$c] ?? null;

it('separa válidas de errores sin perder ninguna fila', function () use ($linea, $mapa) {
    $r = Consolidado::clasificar([
        $linea(2, 'AB123CD'),
        $linea(3, 'ZZ999ZZ'),                       // unidad desconocida
        $linea(4, 'INT-2', ['litros' => '-5']),     // negativo
        $linea(5, 'INT-2', ['costo_total' => '1,5']), // coma decimal
        $linea(6, 'AB123CD'),                       // repetida
        $linea(7, 'INT-2', ['periodo' => '2026-08']), // otro período
        $linea(8, 'INT-2'),
    ], '2026-09', $mapa);

    expect(array_column($r['validas'], 'id_unidad'))->toBe([1, 2])
        ->and(array_column($r['errores'], 'fila'))->toBe([3, 4, 5, 6, 7])
        ->and($r['errores'][3]['mensaje'])->toContain('ya figura en la fila 2');
});

it('valida el período AAAA-MM', function () {
    Consolidado::validarPeriodo('2026-09');
    expect(fn () => Consolidado::validarPeriodo('2026-13'))->toThrow(ReglaDeNegocioException::class)
        ->and(fn () => Consolidado::validarPeriodo('09/2026'))->toThrow(ReglaDeNegocioException::class);
});
