<?php

namespace App\Contexts\IdentityAccess\Infrastructure\Persistence;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RolModel extends Model
{
    protected $table = 'rol';

    protected $primaryKey = 'id_rol';

    public $timestamps = false;

    protected $fillable = ['codigo', 'nombre', 'descripcion', 'estado_activo'];

    protected function casts(): array
    {
        return ['estado_activo' => 'boolean'];
    }

    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(PermisoModel::class, 'rol_permiso', 'id_rol', 'id_permiso');
    }
}
