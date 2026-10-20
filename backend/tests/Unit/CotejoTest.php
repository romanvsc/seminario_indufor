<?php

use App\Contexts\Logistics\Domain\Cotejo;

// Dominio puro: cotejo exacto viaje ↔ remito (RF07, RF08, D05, D06)

$base = ['volumen' => '30.00', 'id_tipo_madera' => 1, 'tipo_madera' => 'pulpable', 'id_transportista' => 7, 'transportista' => 'Pérez, Juan'];

it('coincidencia exacta: sin diferencias, aunque el texto del volumen difiera en ceros', function () use ($base) {
    expect(Cotejo::diferencias($base, $base))->toBe([])
        ->and(Cotejo::diferencias($base, ['volumen' => '30'] + $base))->toBe([]);
});

it('detecta cada campo por separado, sin tolerancias', function (array $remito, string $empieza) use ($base) {
    $d = Cotejo::diferencias($base, $remito + $base);
    expect($d)->toHaveCount(1)->and($d[0])->toStartWith($empieza);
})->with([
    'volumen por un centésimo' => [['volumen' => '30.01'], 'Volumen'],
    'tipo de madera' => [['id_tipo_madera' => 2, 'tipo_madera' => 'aserrable'], 'Tipo de madera'],
    'transportista' => [['id_transportista' => 8, 'transportista' => 'Gómez, Ana'], 'Transportista'],
]);

it('informa todas las diferencias juntas', function () use ($base) {
    expect(Cotejo::diferencias($base, ['volumen' => '29.00', 'id_tipo_madera' => 2, 'tipo_madera' => 'aserrable', 'id_transportista' => 8, 'transportista' => 'X']))
        ->toHaveCount(3);
});
