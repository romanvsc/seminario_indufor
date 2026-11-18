<?php

namespace App\Contexts\Production\Domain;

use App\Contexts\Frentes\Domain\ModalidadProduccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Reglas del parte diario (RF01–RF03, D03, D04, D18). Puras: reciben hechos ya resueltos.
 */
final class ParteProduccion
{
    /**
     * @param  string  $fecha  Y-m-d, jornada del parte
     * @param  string  $hoy  Y-m-d en America/Argentina/Buenos_Aires
     */
    public static function validar(
        ModalidadProduccion $modalidad,
        bool $registranteEsEncargado,
        bool $registranteEsOperario,
        int $idRegistrante,
        ?int $idOperario,
        ?string $toneladas,
        ?string $metrosCubicos,
        string $fecha,
        string $hoy,
        bool $registranteEsAdministracion = false,
    ): void {
        // D03: toneladas y m³ son magnitudes distintas; alcanza con una, nunca negativas ni convertidas
        if ($toneladas === null && $metrosCubicos === null) {
            self::falla('SIN_MAGNITUD', 'Indicá toneladas o metros cúbicos.', 'cantidad_toneladas');
        }
        foreach (['cantidad_toneladas' => $toneladas, 'metros_cubicos' => $metrosCubicos] as $campo => $valor) {
            if ($valor !== null && (float) $valor < 0) {
                self::falla('MAGNITUD_NEGATIVA', 'Las cantidades no pueden ser negativas.', $campo);
            }
        }

        if ($fecha > $hoy) {
            self::falla('FECHA_FUTURA', 'La jornada del parte no puede ser posterior a hoy.', 'fecha_registro');
        }

        match ($modalidad) {
            ModalidadProduccion::Consolidada => $registranteEsEncargado || $registranteEsAdministracion
                || self::falla('MODALIDAD_NO_PERMITIDA', 'En este frente la producción la carga el encargado en forma consolidada.', 'id_frente'),
            // D32: Administración carga en nombre del operario, que tiene que indicarse
            ModalidadProduccion::Individual => ($registranteEsAdministracion
                ? $idOperario !== null || self::falla('SIN_OPERARIO', 'Indicá el operario que produjo.', 'id_operario')
                : ($registranteEsOperario && $idOperario === $idRegistrante))
                || self::falla('MODALIDAD_NO_PERMITIDA', 'En este frente cada operario carga su propia producción.', 'id_frente'),
        };
    }

    private static function falla(string $codigo, string $mensaje, string $campo): never
    {
        throw new ReglaDeNegocioException($codigo, $mensaje, [$campo => [$mensaje]]);
    }
}
