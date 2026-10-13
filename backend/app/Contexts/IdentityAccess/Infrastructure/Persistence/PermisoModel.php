<?php

namespace App\Contexts\IdentityAccess\Infrastructure\Persistence;

use Illuminate\Database\Eloquent\Model;

class PermisoModel extends Model
{
    protected $table = 'permiso';

    protected $primaryKey = 'id_permiso';

    public $timestamps = false;

    protected $fillable = ['codigo', 'descripcion'];
}
