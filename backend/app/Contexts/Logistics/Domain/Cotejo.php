<?php

namespace App\Contexts\Logistics\Domain;

/**
 * Cotejo viaje ↔ remito (RF07, RF08, D05, D06). Igualdad exacta a 2 decimales, sin tolerancias.
 * Un viaje solo llega a VALIDADO si esta función no devuelve diferencias.
 */
final class Cotejo
{
    /**
     * @param  array{volumen: string, id_tipo_madera: int, tipo_madera: string, id_transportista: int, transportista: string}  $declaracion
     * @param  array{volumen: string, id_tipo_madera: int, tipo_madera: string, id_transportista: int, transportista: string}  $remito
     * @return list<string> una línea legible por cada campo que no coincide
     */
    public static function diferencias(array $declaracion, array $remito): array
    {
        $d = [];
        if (self::toneladas($declaracion['volumen']) !== self::toneladas($remito['volumen'])) {
            $d[] = "Volumen: declarado {$declaracion['volumen']} t, remito {$remito['volumen']} t.";
        }
        if ($declaracion['id_tipo_madera'] !== $remito['id_tipo_madera']) {
            $d[] = "Tipo de madera: declarado {$declaracion['tipo_madera']}, remito {$remito['tipo_madera']}.";
        }
        if ($declaracion['id_transportista'] !== $remito['id_transportista']) {
            $d[] = "Transportista: declaró {$declaracion['transportista']}, el remito indica {$remito['transportista']}.";
        }

        return $d;
    }

    /** Normaliza a 2 decimales en texto: compara "12.5" y "12.50" como iguales, y 12.50 ≠ 12.51. */
    private static function toneladas(string $valor): string
    {
        return number_format((float) $valor, 2, '.', '');
    }
}
