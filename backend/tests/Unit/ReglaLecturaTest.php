<?php

use App\Contexts\Maintenance\Domain\ReglaLectura;
use App\Contexts\Maquinaria\Domain\Metrica;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

// Dominio puro: RNF05 y reglas de la lectura semanal (RF09, RF10, D08, D20)

$codigo = function (array $c = []): ?string {
    $a = array_merge([
        'metrica' => Metrica::Horometro, 'horometro' => '1250.50', 'kilometraje' => null, 'tieneFalla' => false, 'detalleFalla' => null,
        'fecha' => '2026-10-19 08:00:00', 'ahora' => '2026-10-19 10:00:00',
        'anterior' => ['valor' => '1200.00', 'fecha' => '12/10/2026 08:00'], 'posterior' => null,
    ], $c);
    try {
        ReglaLectura::validar(...$a);

        return null;
    } catch (ReglaDeNegocioException $e) {
        return $e->codigo;
    }
};

it('acepta una lectura mayor o igual a la anterior y la primera sin antecedente', function () use ($codigo) {
    expect($codigo())->toBeNull()
        ->and($codigo(['horometro' => '1200.00']))->toBeNull()
        ->and($codigo(['anterior' => null]))->toBeNull();
});

it('rechaza la lectura inferior a la anterior, aunque sea por un centésimo (RNF05)', function () use ($codigo) {
    expect($codigo(['horometro' => '1199.99']))->toBe('LECTURA_REGRESIVA')
        ->and($codigo(['horometro' => '1052.00']))->toBe('LECTURA_REGRESIVA'); // dígitos invertidos
});

it('una lectura atrasada no puede superar a la posterior (D08)', function () use ($codigo) {
    expect($codigo(['posterior' => ['valor' => '1240.00', 'fecha' => '19/10/2026 09:00']]))->toBe('LECTURA_REGRESIVA')
        ->and($codigo(['horometro' => '1230.00', 'posterior' => ['valor' => '1240.00', 'fecha' => '19/10/2026 09:00']]))->toBeNull();
});

it('la métrica la decide la unidad', function () use ($codigo) {
    expect($codigo(['kilometraje' => '5000']))->toBe('METRICA_INCORRECTA')
        ->and($codigo(['metrica' => Metrica::Kilometraje, 'horometro' => null, 'kilometraje' => '85000', 'anterior' => null]))->toBeNull()
        ->and($codigo(['metrica' => Metrica::Kilometraje, 'anterior' => null]))->toBe('METRICA_INCORRECTA');
});

it('falla: exige detalle; con instrumento roto se acepta sin valor (D20)', function () use ($codigo) {
    expect($codigo(['tieneFalla' => true]))->toBe('FALLA_SIN_DETALLE')
        ->and($codigo(['tieneFalla' => true, 'detalleFalla' => 'Pantalla del horómetro rota', 'horometro' => null]))->toBeNull()
        ->and($codigo(['horometro' => null]))->toBe('SIN_VALOR')
        ->and($codigo(['tieneFalla' => true, 'detalleFalla' => 'Sensor', 'horometro' => '100']))->toBe('LECTURA_REGRESIVA');
});

it('rechaza fecha futura', function () use ($codigo) {
    expect($codigo(['fecha' => '2026-10-19 11:00:00']))->toBe('FECHA_FUTURA');
});
