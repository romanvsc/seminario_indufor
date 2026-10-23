<?php

namespace App\Contexts\Maintenance\Domain;

use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Datos obligatorios del control mensual según el estado (RF11, D24). Nunca se acepta una fecha ficticia:
 * - OK: el vencimiento de carga es obligatorio (lo informa la etiqueta);
 * - DESCARGADO / DANADO: obligatorio, salvo que se marque la etiqueta como ilegible (entonces va vacío);
 * - FALTANTE: no hay etiqueta; el vencimiento no se pide ni se admite.
 */
final class ReglaMatafuego
{
    public static function validar(EstadoMatafuego $estado, ?string $vencimiento, bool $etiquetaIlegible): void
    {
        if ($estado === EstadoMatafuego::Faltante) {
            if ($vencimiento !== null || $etiquetaIlegible) {
                self::falla('VENCIMIENTO_NO_APLICA', 'Si el matafuego falta no hay etiqueta: dejá el vencimiento vacío.', 'fecha_vencimiento_carga');
            }

            return;
        }
        if ($etiquetaIlegible && $estado === EstadoMatafuego::Ok) {
            self::falla('ETIQUETA_ILEGIBLE_NO_APLICA', 'Un matafuego en estado OK tiene que tener la etiqueta legible: indicá el vencimiento.', 'etiqueta_ilegible');
        }
        if ($etiquetaIlegible && $vencimiento !== null) {
            self::falla('VENCIMIENTO_CON_ETIQUETA_ILEGIBLE', 'Si la etiqueta no se puede leer, dejá el vencimiento vacío.', 'fecha_vencimiento_carga');
        }
        if (! $etiquetaIlegible && $vencimiento === null) {
            self::falla('VENCIMIENTO_REQUERIDO', $estado === EstadoMatafuego::Ok
                ? 'Indicá el vencimiento de la carga (figura en la etiqueta).'
                : 'Indicá el vencimiento de la carga o marcá que la etiqueta no se puede leer.', 'fecha_vencimiento_carga');
        }
    }

    private static function falla(string $codigo, string $mensaje, string $campo): never
    {
        throw new ReglaDeNegocioException($codigo, $mensaje, [$campo => [$mensaje]]);
    }
}
