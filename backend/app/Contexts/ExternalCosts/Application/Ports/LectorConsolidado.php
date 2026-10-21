<?php

namespace App\Contexts\ExternalCosts\Application\Ports;

/** Puerto de entrada: traduce el consolidado externo a líneas del modelo interno (RF13). */
interface LectorConsolidado
{
    /**
     * Lanza ReglaDeNegocioException si el archivo entero no respeta el contrato (p. ej. encabezado).
     *
     * @return list<array{fila: int, periodo: string, codigo_unidad: string, litros: string, costo_total: string, referencia: ?string}>
     */
    public function leer(string $contenido): array;
}
