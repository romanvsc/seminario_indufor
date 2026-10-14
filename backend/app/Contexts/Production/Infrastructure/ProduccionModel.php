<?php

namespace App\Contexts\Production\Infrastructure;

use App\Contexts\Frentes\Infrastructure\FrenteModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id_produccion
 * @property int $id_usuario
 * @property Carbon $fecha_registro
 */
class ProduccionModel extends Model
{
    protected $table = 'produccion';

    protected $primaryKey = 'id_produccion';

    protected $fillable = ['id_unidad', 'id_usuario', 'id_operario', 'id_frente', 'tipo_madera', 'fecha_registro', 'cantidad_toneladas', 'metros_cubicos', 'foto_soporte', 'observaciones'];

    protected function casts(): array
    {
        return ['fecha_registro' => 'date:Y-m-d', 'cantidad_toneladas' => 'decimal:2', 'metros_cubicos' => 'decimal:2'];
    }

    /** production.view: solo partes de frentes a los que el usuario estaba asignado en la fecha de cada parte. */
    public function scopeVisiblesPara(Builder $query, int $idUsuario): void
    {
        $query->whereExists(fn ($q) => $q->from('frente_asignado as fa')
            ->whereColumn('fa.id_frente', 'produccion.id_frente')
            ->where('fa.id_usuario', $idUsuario)
            ->whereColumn('fa.fecha_desde', '<=', 'produccion.fecha_registro')
            ->where(fn ($w) => $w->whereNull('fa.fecha_hasta')->orWhereColumn('fa.fecha_hasta', '>=', 'produccion.fecha_registro')));
    }

    public function frente(): BelongsTo
    {
        return $this->belongsTo(FrenteModel::class, 'id_frente', 'id_frente');
    }

    public function unidad(): BelongsTo
    {
        return $this->belongsTo(UnidadModel::class, 'id_unidad', 'id_unidad');
    }

    public function tipo(): BelongsTo
    {
        return $this->belongsTo(TipoMaderaModel::class, 'tipo_madera', 'id_tipo_madera');
    }

    public function registrante(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario', 'id_usuario');
    }

    public function operario(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_operario', 'id_usuario');
    }
}
