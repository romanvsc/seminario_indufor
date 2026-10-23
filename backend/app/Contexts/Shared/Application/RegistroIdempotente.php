<?php

namespace App\Contexts\Shared\Application;

/**
 * Reintentos sin duplicados (D22, specs/05-idempotencia.md): una misma clave de un usuario para una operación
 * produce a lo sumo un registro, aunque lleguen dos envíos a la vez o el reintento sea días después.
 */
interface RegistroIdempotente
{
    /**
     * Sin clave, solo ejecuta $crear. Con clave:
     * - primera vez: ejecuta $crear y guarda la clave en la misma transacción;
     * - clave ya usada con el mismo contenido: no ejecuta nada y devuelve el registro existente;
     * - clave ya usada con otro contenido: lanza ReglaDeNegocioException CLAVE_REUTILIZADA (409).
     *
     * @param  array<string, mixed>  $contenido  datos ya validados y normalizados del envío
     * @param  callable(): int  $crear
     * @return array{id: int, nuevo: bool}
     */
    public function ejecutar(int $idUsuario, string $operacion, ?string $clave, array $contenido, callable $crear): array;
}
