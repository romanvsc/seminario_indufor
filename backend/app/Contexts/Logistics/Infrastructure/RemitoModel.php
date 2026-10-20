<?php

namespace App\Contexts\Logistics\Infrastructure;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RemitoModel extends Model
{
    protected $table = 'remito';

    protected $primaryKey = 'numero_remito';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['numero_remito', 'id_viaje', 'fecha_remito', 'id_transportista', 'tipo_madera_remito', 'volumen_toneladas_remito', 'fecha_recepcion_admin'];

    protected function casts(): array
    {
        return ['fecha_remito' => 'date:Y-m-d', 'fecha_recepcion_admin' => 'datetime', 'volumen_toneladas_remito' => 'decimal:2'];
    }

    public function transportista(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_transportista', 'id_usuario');
    }

    public function tipo(): BelongsTo
    {
        return $this->belongsTo(TipoMaderaModel::class, 'tipo_madera_remito', 'id_tipo_madera');
    }
}
