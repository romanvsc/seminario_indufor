<?php

namespace App\Contexts\Maintenance\Domain;

use App\Contexts\Maquinaria\Domain\Metrica;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Reglas de la lectura semanal (RF09, RF10, RNF05, D08, D20). Puras: reciben las lecturas vecinas ya resueltas.
 */
final class ReglaLectura
{
    /**
     * @param  string|null  $valor  valor informado en la métrica de la unidad (null solo si hay falla de instrumento)
     * @param  array{valor: string, fecha: string}|null  $anterior  lectura con valor inmediatamente anterior por fecha
     * @param  array{valor: string, fecha: string}|null  $posterior  lectura con valor inmediatamente posterior (carga atrasada)
     */
    public static function validar(
        Metrica $metrica,
        ?string $horometro,
        ?string $kilometraje,
        bool $tieneFalla,
        ?string $detalleFalla,
        string $fecha,
        string $ahora,
        ?array $anterior,
        ?array $posterior,
    ): void {
        // La unidad determina la métrica: el otro campo debe ir vacío (D08)
        [$valor, $otro, $campo, $unidad] = $metrica === Metrica::Horometro
            ? [$horometro, $kilometraje, 'horometro_actual', 'h']
            : [$kilometraje, $horometro, 'kilometraje_actual', 'km'];
        if ($otro !== null) {
            self::falla('METRICA_INCORRECTA', $metrica === Metrica::Horometro
                ? 'Esta unidad se controla por horómetro, no por kilometraje.'
                : 'Esta unidad se controla por kilometraje, no por horómetro.', $campo);
        }
        if ($tieneFalla && trim((string) $detalleFalla) === '') {
            self::falla('FALLA_SIN_DETALLE', 'Describí la falla para que Mantenimiento pueda atenderla.', 'detalle_falla');
        }
        // D20: solo con el instrumento roto se acepta una lectura sin valor
        if ($valor === null && ! $tieneFalla) {
            self::falla('SIN_VALOR', $metrica === Metrica::Horometro ? 'Indicá la lectura del horómetro.' : 'Indicá el kilometraje.', $campo);
        }
        if ($valor !== null && (float) $valor < 0) {
            self::falla('VALOR_NEGATIVO', 'La lectura no puede ser negativa.', $campo);
        }
        if ($fecha > $ahora) {
            self::falla('FECHA_FUTURA', 'La fecha de la lectura no puede ser posterior a ahora.', 'fecha_lectura');
        }
        if ($valor === null) {
            return;
        }

        // RNF05: nunca inferior a la anterior; si es atrasada, nunca superior a la posterior (D08)
        if ($anterior !== null && (float) $valor < (float) $anterior['valor']) {
            self::falla('LECTURA_REGRESIVA', "La lectura anterior fue {$anterior['valor']} {$unidad} ({$anterior['fecha']}). Revisá si los números están invertidos.", $campo);
        }
        if ($posterior !== null && (float) $valor > (float) $posterior['valor']) {
            self::falla('LECTURA_REGRESIVA', "Ya hay una lectura posterior de {$posterior['valor']} {$unidad} ({$posterior['fecha']}); esta no puede ser mayor.", $campo);
        }
    }

    private static function falla(string $codigo, string $mensaje, string $campo): never
    {
        throw new ReglaDeNegocioException($codigo, $mensaje, [$campo => [$mensaje]]);
    }
}
