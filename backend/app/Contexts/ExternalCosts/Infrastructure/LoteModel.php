<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Registro local de cada intercambio con el sistema externo (tabla integracion_lote).
 *
 * @property int $id_lote
 * @property Carbon $iniciado_at
 * @property Carbon|null $finalizado_at
 */
class LoteModel extends Model
{
    protected $table = 'integracion_lote';

    protected $primaryKey = 'id_lote';

    public $timestamps = false;

    protected $fillable = ['tipo', 'periodo', 'nombre_archivo', 'checksum', 'estado', 'id_usuario', 'iniciado_at', 'finalizado_at', 'detalle_error'];

    protected function casts(): array
    {
        return ['iniciado_at' => 'datetime', 'finalizado_at' => 'datetime'];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario', 'id_usuario');
    }

    public function consumos(): HasMany
    {
        return $this->hasMany(ConsumoModel::class, 'id_lote', 'id_lote');
    }
}
