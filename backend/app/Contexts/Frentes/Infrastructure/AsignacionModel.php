<?php

namespace App\Contexts\Frentes\Infrastructure;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_asignacion
 * @property int $id_frente
 * @property int $id_usuario
 */
class AsignacionModel extends Model
{
    protected $table = 'frente_asignado';

    protected $primaryKey = 'id_asignacion';

    protected $fillable = ['id_frente', 'id_usuario', 'fecha_desde', 'fecha_hasta'];

    protected function casts(): array
    {
        return ['fecha_desde' => 'date:Y-m-d', 'fecha_hasta' => 'date:Y-m-d'];
    }

    public function frente(): BelongsTo
    {
        return $this->belongsTo(FrenteModel::class, 'id_frente', 'id_frente');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario', 'id_usuario');
    }
}
