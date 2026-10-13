<?php

namespace App\Contexts\Maquinaria\Infrastructure;

use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Unidad de la flota (tabla maquinaria).
 *
 * @property int $id_unidad
 * @property bool $estado_activo
 */
class UnidadModel extends Model
{
    protected $table = 'maquinaria';

    protected $primaryKey = 'id_unidad';

    protected $fillable = ['nombre', 'dominio_patente', 'marca_modelo', 'id_frente_actual', 'id_tipo_maquinaria', 'id_usuario', 'estado_activo'];

    protected function casts(): array
    {
        return ['estado_activo' => 'boolean'];
    }

    public function tipo(): BelongsTo
    {
        return $this->belongsTo(TipoMaquinariaModel::class, 'id_tipo_maquinaria', 'id_tipo_maquinaria');
    }

    public function frente(): BelongsTo
    {
        return $this->belongsTo(FrenteModel::class, 'id_frente_actual', 'id_frente');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario', 'id_usuario');
    }
}
