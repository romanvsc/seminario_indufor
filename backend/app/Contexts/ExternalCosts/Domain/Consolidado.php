<?php

namespace App\Contexts\ExternalCosts\Domain;

use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Reglas del consolidado mensual en el modelo interno (RF13, D13). No conoce el formato del archivo.
 */
final class Consolidado
{
    public static function validarPeriodo(string $periodo): void
    {
        if (! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $periodo)) {
            $mensaje = 'El período debe tener el formato AAAA-MM.';
            throw new ReglaDeNegocioException('PERIODO_INVALIDO', $mensaje, ['periodo' => [$mensaje]]);
        }
    }

    /**
     * Separa las líneas válidas de las que tienen error, sin descartar ninguna en silencio.
     *
     * @param  list<array{fila: int, periodo: string, codigo_unidad: string, litros: string, costo_total: string, referencia: ?string}>  $lineas
     * @param  callable(string): ?int  $unidadPorCodigo
     * @return array{validas: list<array{id_unidad: int, litros: string, costo_total: string, referencia: ?string}>, errores: list<array{fila: int, mensaje: string}>}
     */
    public static function clasificar(array $lineas, string $periodo, callable $unidadPorCodigo): array
    {
        $validas = [];
        $errores = [];
        $vistas = [];
        foreach ($lineas as $l) {
            $error = match (true) {
                $l['periodo'] !== $periodo => "El período {$l['periodo']} no coincide con el declarado ({$periodo}).",
                ! self::importe($l['litros']) => "Litros inválidos: «{$l['litros']}».",
                ! self::importe($l['costo_total']) => "Costo inválido: «{$l['costo_total']}».",
                default => null,
            };
            $idUnidad = $error === null ? $unidadPorCodigo($l['codigo_unidad']) : null;
            if ($error === null && $idUnidad === null) {
                $error = "La unidad «{$l['codigo_unidad']}» no existe en INDUFOR; no se crea automáticamente.";
            }
            if ($error === null && isset($vistas[$idUnidad])) {
                $error = "La unidad «{$l['codigo_unidad']}» ya figura en la fila {$vistas[$idUnidad]}.";
            }
            if ($error !== null) {
                $errores[] = ['fila' => $l['fila'], 'mensaje' => $error];

                continue;
            }
            $vistas[$idUnidad] = $l['fila'];
            $validas[] = ['id_unidad' => $idUnidad, 'litros' => $l['litros'], 'costo_total' => $l['costo_total'], 'referencia' => $l['referencia']];
        }

        return ['validas' => $validas, 'errores' => $errores];
    }

    /** Número no negativo con hasta 2 decimales y punto decimal. */
    private static function importe(string $valor): bool
    {
        return (bool) preg_match('/^\d{1,12}(\.\d{1,2})?$/', $valor);
    }
}
