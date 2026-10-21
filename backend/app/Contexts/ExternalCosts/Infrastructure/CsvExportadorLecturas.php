<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\ExternalCosts\Application\Ports\ExportadorLecturas;
use Illuminate\Support\Facades\Storage;

/** Adaptador CSV v1 de salida (ADR-004): un archivo por lectura en el buzón del sistema externo. */
final class CsvExportadorLecturas implements ExportadorLecturas
{
    public const CARPETA = 'integracion/salida';

    public function exportar(array $lectura): array
    {
        $nombre = "lectura-{$lectura['id_lectura']}.csv";
        $contenido = "version,id_lectura,codigo_unidad,fecha_lectura,metrica,valor\n"
            ."1,{$lectura['id_lectura']},{$lectura['codigo_unidad']},{$lectura['fecha_lectura']},{$lectura['metrica']},{$lectura['valor']}\n";

        // Nombre fijo por lectura: reexportar reemplaza el archivo, nunca lo duplica
        if (! Storage::disk('local')->put(self::CARPETA."/{$nombre}", $contenido)) {
            throw new \RuntimeException("No se pudo escribir {$nombre} en el buzón de salida.");
        }

        return ['nombre_archivo' => $nombre, 'checksum' => hash('sha256', $contenido)];
    }
}
