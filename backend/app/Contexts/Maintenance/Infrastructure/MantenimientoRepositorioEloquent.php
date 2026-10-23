<?php

namespace App\Contexts\Maintenance\Infrastructure;

use App\Contexts\Maintenance\Application\Ports\MantenimientoRepositorio;
use App\Contexts\Maquinaria\Domain\Metrica;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;

final class MantenimientoRepositorioEloquent implements MantenimientoRepositorio
{
    public function bloquearUnidad(int $idUnidad): ?Metrica
    {
        return UnidadModel::with('tipo')->where('estado_activo', true)->lockForUpdate()->find($idUnidad)?->tipo->metrica;
    }

    public function lecturaVecina(int $idUnidad, Metrica $metrica, string $fecha, bool $anterior): ?array
    {
        $campo = $metrica === Metrica::Horometro ? 'horometro_actual' : 'kilometraje_actual';
        $l = LecturaModel::where('id_unidad', $idUnidad)->whereNotNull($campo)
            ->where('fecha_lectura', $anterior ? '<=' : '>', $fecha)
            ->orderBy('fecha_lectura', $anterior ? 'desc' : 'asc')->orderBy('id_lectura', $anterior ? 'desc' : 'asc')
            ->first();

        return $l === null ? null : ['valor' => (string) $l->{$campo}, 'fecha' => $l->fecha_lectura->format('d/m/Y H:i')];
    }

    public function crearLectura(array $datos): int
    {
        return LecturaModel::create($datos)->id_lectura;
    }

    public function lectura(int $idLectura, bool $bloquear = false): ?array
    {
        $l = LecturaModel::query()->when($bloquear, fn ($q) => $q->lockForUpdate())->find($idLectura);

        return $l === null ? null : [
            'id_lectura' => $l->id_lectura,
            'id_unidad' => $l->id_unidad,
            'id_operario_reporte' => $l->id_operario_reporte,
            'fecha_lectura' => $l->fecha_lectura->format('Y-m-d H:i:s'),
            'horometro_actual' => $l->horometro_actual,
            'kilometraje_actual' => $l->kilometraje_actual,
            'tiene_falla' => $l->tiene_falla,
            'detalle_falla' => $l->detalle_falla,
            'falla_atendida_at' => $l->falla_atendida_at?->format('Y-m-d H:i:s'),
            'id_usuario_atencion' => $l->id_usuario_atencion,
            'nota_atencion' => $l->nota_atencion,
        ];
    }

    public function actualizarLectura(int $idLectura, array $datos): void
    {
        LecturaModel::findOrFail($idLectura)->update($datos);
    }

    public function unidadActiva(int $idUnidad): bool
    {
        return UnidadModel::where('estado_activo', true)->whereKey($idUnidad)->exists();
    }

    public function crearControl(array $datos): int
    {
        return ControlMatafuegoModel::create($datos)->id_control;
    }

    public function control(int $idControl): ?array
    {
        $c = ControlMatafuegoModel::find($idControl);

        return $c === null ? null : [
            'id_control' => $c->id_control,
            'id_unidad' => $c->id_unidad,
            'id_operario' => $c->id_operario,
            'estado_matafuego' => $c->estado_matafuego,
            'fecha_revision' => $c->fecha_revision->format('Y-m-d'),
            'fecha_vencimiento_carga' => $c->fecha_vencimiento_carga?->format('Y-m-d'),
            'etiqueta_ilegible' => $c->etiqueta_ilegible,
        ];
    }
}
