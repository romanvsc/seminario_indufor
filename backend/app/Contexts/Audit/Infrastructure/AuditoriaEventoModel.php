<?php

namespace App\Contexts\Audit\Infrastructure;

use Illuminate\Database\Eloquent\Model;

/** Evento de auditoría. Solo inserción: no se actualiza ni se borra. */
class AuditoriaEventoModel extends Model
{
    protected $table = 'auditoria_evento';

    protected $primaryKey = 'id_evento';

    public const UPDATED_AT = null;

    protected $guarded = ['id_evento'];

    protected function casts(): array
    {
        return ['before_json' => 'array', 'after_json' => 'array', 'created_at' => 'datetime'];
    }
}
