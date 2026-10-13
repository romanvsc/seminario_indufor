<?php

namespace App\Contexts\Maquinaria\Infrastructure;

use App\Contexts\Maquinaria\Application\Ports\MaquinariaRepositorio;
use Illuminate\Database\Eloquent\Model;

final class MaquinariaRepositorioEloquent implements MaquinariaRepositorio
{
    private const MODELOS = ['tipo_maquinaria' => TipoMaquinariaModel::class, 'maquinaria' => UnidadModel::class];

    public function crear(string $entidad, array $datos): int
    {
        return (int) $this->modelo($entidad)::create($datos)->getKey();
    }

    public function actualizar(string $entidad, int $id, array $datos): void
    {
        $this->modelo($entidad)::findOrFail($id)->update($datos);
    }

    public function snapshot(string $entidad, int $id): ?array
    {
        $fila = $this->modelo($entidad)::find($id);

        return $fila === null ? null : collect($fila->attributesToArray())->except(['created_at', 'updated_at'])->all();
    }

    /** @return class-string<Model> */
    private function modelo(string $entidad): string
    {
        return self::MODELOS[$entidad] ?? throw new \InvalidArgumentException("Entidad desconocida: {$entidad}");
    }
}
