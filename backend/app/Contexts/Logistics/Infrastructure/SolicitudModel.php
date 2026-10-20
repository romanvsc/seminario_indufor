<?php

namespace App\Contexts\Logistics\Infrastructure;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id_solicitud
 * @property int $id_viaje
 */
class SolicitudModel extends Model
{
    protected $table = 'solicitud_correccion';

    protected $primaryKey = 'id_solicitud';

    protected $fillable = ['id_viaje', 'fecha_solicitud', 'detalle_diferencias', 'estado', 'fecha_resolucion', 'id_usuario_responsable'];

    protected function casts(): array
    {
        return ['fecha_solicitud' => 'datetime', 'fecha_resolucion' => 'datetime'];
    }

    public function viaje(): BelongsTo
    {
        return $this->belongsTo(ViajeModel::class, 'id_viaje', 'id_viaje');
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario_responsable', 'id_usuario');
    }
}
