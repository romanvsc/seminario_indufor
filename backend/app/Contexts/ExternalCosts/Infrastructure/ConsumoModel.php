<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumoModel extends Model
{
    protected $table = 'consumo_importado';

    protected $primaryKey = 'id_consumo';

    const UPDATED_AT = null;

    protected $fillable = ['id_lote', 'id_unidad', 'periodo', 'litros', 'costo_total', 'referencia_externa'];

    protected function casts(): array
    {
        return ['litros' => 'decimal:2', 'costo_total' => 'decimal:2'];
    }

    public function unidad(): BelongsTo
    {
        return $this->belongsTo(UnidadModel::class, 'id_unidad', 'id_unidad');
    }
}
