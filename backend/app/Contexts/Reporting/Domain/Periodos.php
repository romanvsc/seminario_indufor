<?php

namespace App\Contexts\Reporting\Domain;

use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Límites de los cortes de reporte (D10): quincenas 1–15 y 16–fin de mes; el mensual es el período vencido.
 * Fechas en texto Y-m-d, ya en America/Argentina/Buenos_Aires.
 */
final class Periodos
{
    /** @return array{desde: string, hasta: string} */
    public static function quincena(string $periodo, int $numero): array
    {
        self::validarPeriodo($periodo);
        if ($numero !== 1 && $numero !== 2) {
            throw new ReglaDeNegocioException('QUINCENA_INVALIDA', 'La quincena es 1 (días 1 a 15) o 2 (16 a fin de mes).', ['quincena' => ['Elegí la quincena 1 o 2.']]);
        }
        $ultimo = (int) date('t', (int) strtotime("{$periodo}-01"));

        return $numero === 1
            ? ['desde' => "{$periodo}-01", 'hasta' => "{$periodo}-15"]
            : ['desde' => "{$periodo}-16", 'hasta' => sprintf('%s-%02d', $periodo, $ultimo)];
    }

    /** @return array{periodo: string, numero: int} */
    public static function quincenaDe(string $fecha): array
    {
        return ['periodo' => substr($fecha, 0, 7), 'numero' => (int) substr($fecha, 8, 2) <= 15 ? 1 : 2];
    }

    /** @return array{desde: string, hasta: string} */
    public static function mes(string $periodo): array
    {
        $q2 = self::quincena($periodo, 2);

        return ['desde' => "{$periodo}-01", 'hasta' => $q2['hasta']];
    }

    /** RF15: el consolidado mensual corresponde al mes anterior al de la fecha dada. */
    public static function periodoVencido(string $hoy): string
    {
        [$a, $m] = array_map('intval', explode('-', substr($hoy, 0, 7)));

        return $m === 1 ? sprintf('%04d-12', $a - 1) : sprintf('%04d-%02d', $a, $m - 1);
    }

    public static function validarPeriodo(string $periodo): void
    {
        if (! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $periodo)) {
            throw new ReglaDeNegocioException('PERIODO_INVALIDO', 'El período debe tener el formato AAAA-MM.', ['periodo' => ['El período debe tener el formato AAAA-MM.']]);
        }
    }
}
