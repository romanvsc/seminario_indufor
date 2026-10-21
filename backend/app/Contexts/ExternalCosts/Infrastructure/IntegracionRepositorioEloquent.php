<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\ExternalCosts\Application\Ports\IntegracionRepositorio;
use App\Contexts\Maintenance\Infrastructure\LecturaModel;
use Illuminate\Support\Facades\DB;

final class IntegracionRepositorioEloquent implements IntegracionRepositorio
{
    public function lecturasPendientes(): array
    {
        return LecturaModel::query()
            ->where(fn ($q) => $q->whereNotNull('horometro_actual')->orWhereNotNull('kilometraje_actual'))
            ->whereNotExists(fn ($q) => $q->from('integracion_lote')->where('tipo', 'EXPORT_LECTURAS')->where('estado', 'OK')
                ->whereRaw("nombre_archivo = CONCAT('lectura-', lectura_mantenimiento.id_lectura, '.csv')"))
            ->orderBy('id_lectura')->pluck('id_lectura')->all();
    }

    public function lecturaExportable(int $idLectura): ?array
    {
        $l = LecturaModel::with('unidad.tipo')->find($idLectura);
        $valor = $l?->horometro_actual ?? $l?->kilometraje_actual;
        if ($l === null || $valor === null) {
            return null;
        }

        return [
            'id_lectura' => $l->id_lectura,
            'codigo_unidad' => CodigoUnidad::de($l->unidad),
            'fecha_lectura' => $l->fecha_lectura->format('Y-m-d H:i:s'),
            'metrica' => $l->unidad->tipo->metrica->value,
            'valor' => (string) $valor,
        ];
    }

    public function exportacionOk(int $idLectura): bool
    {
        return LoteModel::where('tipo', 'EXPORT_LECTURAS')->where('estado', 'OK')->where('nombre_archivo', "lectura-{$idLectura}.csv")->exists();
    }

    public function crearLote(array $datos): int
    {
        return LoteModel::create($datos)->id_lote;
    }

    public function actualizarLote(int $idLote, array $datos): void
    {
        LoteModel::findOrFail($idLote)->update($datos);
    }

    public function lote(int $idLote): ?array
    {
        $l = LoteModel::find($idLote);

        return $l === null ? null : collect($l->attributesToArray())->except('detalle_error')->all();
    }

    public function importacionPorChecksum(string $checksum): ?int
    {
        return LoteModel::where('tipo', 'IMPORT_CONSUMOS')->where('checksum', $checksum)->whereIn('estado', ['OK', 'PARCIAL'])->value('id_lote');
    }

    public function importacionesDelPeriodo(string $periodo): array
    {
        return LoteModel::where('tipo', 'IMPORT_CONSUMOS')->where('periodo', $periodo)->whereIn('estado', ['OK', 'PARCIAL'])->pluck('id_lote')->all();
    }

    public function unidadPorCodigo(string $codigo): ?int
    {
        return CodigoUnidad::aId($codigo);
    }

    public function insertarConsumos(int $idLote, string $periodo, array $lineas): void
    {
        $ahora = now();
        DB::table('consumo_importado')->insert(array_map(fn ($l) => [
            'id_lote' => $idLote, 'id_unidad' => $l['id_unidad'], 'periodo' => $periodo,
            'litros' => $l['litros'], 'costo_total' => $l['costo_total'], 'referencia_externa' => $l['referencia'], 'created_at' => $ahora,
        ], $lineas));
    }

    public function borrarConsumosDelPeriodo(string $periodo): int
    {
        return ConsumoModel::where('periodo', $periodo)->delete();
    }
}
