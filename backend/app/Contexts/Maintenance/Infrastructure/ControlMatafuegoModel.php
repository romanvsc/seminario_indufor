<?php

namespace App\Contexts\Maintenance\Infrastructure;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id_control
 * @property Carbon $fecha_revision
 * @property Carbon|null $fecha_vencimiento_carga
 * @property bool $etiqueta_ilegible
 */
class ControlMatafuegoModel extends Model
{
    protected $table = 'control_matafuego';

    protected $primaryKey = 'id_control';

    protected $fillable = ['id_unidad', 'id_operario', 'estado_matafuego', 'fecha_revision', 'fecha_vencimiento_carga', 'etiqueta_ilegible'];

    protected function casts(): array
    {
        return ['fecha_revision' => 'date:Y-m-d', 'fecha_vencimiento_carga' => 'date:Y-m-d', 'etiqueta_ilegible' => 'boolean'];
    }

    public function unidad(): BelongsTo
    {
        return $this->belongsTo(UnidadModel::class, 'id_unidad', 'id_unidad');
    }

    public function operario(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_operario', 'id_usuario');
    }
}
