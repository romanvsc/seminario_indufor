<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\Maquinaria\Infrastructure\UnidadModel;

/**
 * Simulador del Sistema de Control de Gastos e Insumos para la entrega del TP (D13, ADR-004).
 * Genera un consolidado CSV v1 válido; los valores son deterministas por unidad y período.
 */
final class SimuladorSistemaExterno
{
    public static function consolidado(string $periodo): string
    {
        $csv = implode(',', CsvV1LectorConsolidado::ENCABEZADO)."\n";
        foreach (UnidadModel::where('estado_activo', true)->orderBy('id_unidad')->get() as $i => $u) {
            $codigo = CodigoUnidad::de($u);
            $litros = number_format(100 + (crc32("{$codigo}{$periodo}") % 70000) / 100, 2, '.', '');
            $costo = number_format((float) $litros * 1350, 2, '.', ''); // precio simulado por litro
            $csv .= "{$periodo},{$codigo},{$litros},{$costo},SIM-{$periodo}-".str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT)."\n";
        }

        return $csv;
    }
}
