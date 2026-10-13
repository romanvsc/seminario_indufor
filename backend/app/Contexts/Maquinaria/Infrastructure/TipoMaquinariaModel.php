<?php

namespace App\Contexts\Maquinaria\Infrastructure;

use App\Contexts\Maquinaria\Domain\Metrica;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id_tipo_maquinaria
 * @property string $nombre
 * @property Metrica $metrica
 * @property bool $estado_activo
 */
class TipoMaquinariaModel extends Model
{
    protected $table = 'tipo_maquinaria';

    protected $primaryKey = 'id_tipo_maquinaria';

    public $timestamps = false;

    protected $fillable = ['nombre', 'metrica', 'estado_activo'];

    protected function casts(): array
    {
        return ['estado_activo' => 'boolean', 'metrica' => Metrica::class];
    }
}
