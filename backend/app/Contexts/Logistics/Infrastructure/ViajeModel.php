<?php

namespace App\Contexts\Logistics\Infrastructure;

use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id_viaje
 * @property int $id_usuario_camionero
 * @property Carbon $fecha
 */
class ViajeModel extends Model
{
    protected $table = 'viaje_logistica';

    protected $primaryKey = 'id_viaje';

    protected $fillable = ['id_unidad_camion', 'id_usuario_camionero', 'id_frente_origen', 'fecha', 'destino', 'tipo_madera', 'volumen_declarado', 'observaciones', 'estado_validacion'];

    protected function casts(): array
    {
        return ['fecha' => 'datetime', 'volumen_declarado' => 'decimal:2'];
    }

    public function camion(): BelongsTo
    {
        return $this->belongsTo(UnidadModel::class, 'id_unidad_camion', 'id_unidad');
    }

    public function camionero(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario_camionero', 'id_usuario');
    }

    public function origen(): BelongsTo
    {
        return $this->belongsTo(FrenteModel::class, 'id_frente_origen', 'id_frente');
    }

    public function tipo(): BelongsTo
    {
        return $this->belongsTo(TipoMaderaModel::class, 'tipo_madera', 'id_tipo_madera');
    }

    public function remito(): HasOne
    {
        return $this->hasOne(RemitoModel::class, 'id_viaje', 'id_viaje');
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(SolicitudModel::class, 'id_viaje', 'id_viaje')->orderByDesc('id_solicitud');
    }
}
