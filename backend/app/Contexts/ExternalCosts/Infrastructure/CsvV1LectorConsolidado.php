<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\ExternalCosts\Application\Ports\LectorConsolidado;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/** Adaptador CSV v1 de entrada (ADR-004). Todo lo que sabe del formato externo está acá. */
final class CsvV1LectorConsolidado implements LectorConsolidado
{
    public const ENCABEZADO = ['periodo', 'codigo_unidad', 'litros', 'costo_total', 'referencia_externa'];

    public function leer(string $contenido): array
    {
        $contenido = preg_replace('/^\xEF\xBB\xBF/', '', $contenido); // BOM de Excel
        $filas = preg_split('/\r\n|\n|\r/', trim($contenido));
        $encabezado = array_map(fn ($c) => strtolower(trim($c)), str_getcsv(array_shift($filas) ?? '', ',', '"', ''));
        if ($encabezado !== self::ENCABEZADO) {
            $mensaje = 'El archivo no respeta el contrato CSV v1. El encabezado debe ser: '.implode(',', self::ENCABEZADO).'.';
            throw new ReglaDeNegocioException('FORMATO_INVALIDO', $mensaje, ['archivo' => [$mensaje]]);
        }

        $lineas = [];
        foreach ($filas as $i => $fila) {
            if (trim($fila) === '') {
                continue;
            }
            $c = array_map('trim', str_getcsv($fila, ',', '"', ''));
            $lineas[] = [
                'fila' => $i + 2, // la fila 1 es el encabezado
                'periodo' => $c[0] ?? '',
                'codigo_unidad' => $c[1] ?? '',
                'litros' => $c[2] ?? '',
                'costo_total' => $c[3] ?? '',
                'referencia' => ($c[4] ?? '') === '' ? null : mb_substr($c[4], 0, 120),
            ];
        }

        return $lineas;
    }
}
