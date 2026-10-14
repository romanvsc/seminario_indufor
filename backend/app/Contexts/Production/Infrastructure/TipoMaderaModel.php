<?php

namespace App\Contexts\Production\Infrastructure;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id_tipo_madera
 * @property string $nombre
 */
class TipoMaderaModel extends Model
{
    protected $table = 'tipo_madera';

    protected $primaryKey = 'id_tipo_madera';

    public $timestamps = false;

    protected $fillable = ['nombre', 'estado_activo'];

    protected function casts(): array
    {
        return ['estado_activo' => 'boolean'];
    }
}
