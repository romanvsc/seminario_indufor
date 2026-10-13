<?php

namespace App\Contexts\Frentes\Infrastructure;

use App\Contexts\Frentes\Domain\ModalidadProduccion;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id_frente
 * @property string $nombre_frente
 * @property bool $estado_activo
 */
class FrenteModel extends Model
{
    protected $table = 'frente_trabajo';

    protected $primaryKey = 'id_frente';

    protected $fillable = ['nombre_frente', 'ubicacion_geografica', 'modalidad_produccion', 'estado_activo'];

    protected function casts(): array
    {
        return ['estado_activo' => 'boolean', 'modalidad_produccion' => ModalidadProduccion::class];
    }
}
