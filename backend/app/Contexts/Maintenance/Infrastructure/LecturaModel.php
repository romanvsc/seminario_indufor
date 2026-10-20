<?php

namespace App\Contexts\Maintenance\Infrastructure;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Maquinaria\Infrastructure\UnidadModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id_lectura
 * @property Carbon $fecha_lectura
 * @property bool $tiene_falla
 * @property Carbon|null $falla_atendida_at
 */
class LecturaModel extends Model
{
    protected $table = 'lectura_mantenimiento';

    protected $primaryKey = 'id_lectura';

    protected $fillable = ['id_unidad', 'id_operario_reporte', 'fecha_lectura', 'horometro_actual', 'kilometraje_actual', 'tiene_falla', 'detalle_falla', 'falla_atendida_at', 'id_usuario_atencion', 'nota_atencion'];

    protected function casts(): array
    {
        return ['fecha_lectura' => 'datetime', 'horometro_actual' => 'decimal:2', 'kilometraje_actual' => 'integer', 'tiene_falla' => 'boolean', 'falla_atendida_at' => 'datetime'];
    }

    /** D20: encargados y operarios ven sus lecturas y las de las unidades de los frentes a los que están asignados hoy. */
    public function scopeVisiblesPara(Builder $query, int $idUsuario, string $hoy): void
    {
        $query->where(fn ($w) => $w->where('id_operario_reporte', $idUsuario)
            ->orWhereIn('id_unidad', fn ($q) => $q->select('m.id_unidad')->from('maquinaria as m')
                ->join('frente_asignado as fa', 'fa.id_frente', '=', 'm.id_frente_actual')
                ->where('fa.id_usuario', $idUsuario)->where('fa.fecha_desde', '<=', $hoy)
                ->where(fn ($v) => $v->whereNull('fa.fecha_hasta')->orWhere('fa.fecha_hasta', '>=', $hoy))));
    }

    public function unidad(): BelongsTo
    {
        return $this->belongsTo(UnidadModel::class, 'id_unidad', 'id_unidad');
    }

    public function operario(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_operario_reporte', 'id_usuario');
    }

    public function atendidoPor(): BelongsTo
    {
        return $this->belongsTo(UsuarioModel::class, 'id_usuario_atencion', 'id_usuario');
    }
}
