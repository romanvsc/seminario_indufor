<?php

namespace App\Contexts\ExternalCosts\Application\Ports;

/** Puerto de salida hacia el sistema externo (RF12). El adaptador decide formato y transporte. */
interface ExportadorLecturas
{
    /**
     * Entrega la lectura. Debe ser idempotente: exportar dos veces la misma lectura no la duplica del otro lado.
     *
     * @param  array{id_lectura: int, codigo_unidad: string, fecha_lectura: string, metrica: string, valor: string}  $lectura
     * @return array{nombre_archivo: string, checksum: string}
     */
    public function exportar(array $lectura): array;
}
