<?php

namespace App\Contexts\IdentityAccess\Infrastructure\Persistence;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Usuario autenticable (tabla usuario). Adaptador de persistencia: sin reglas de negocio.
 *
 * @property int $id_usuario
 * @property string $email
 * @property bool $estado_activo
 */
class UsuarioModel extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuario';

    protected $primaryKey = 'id_usuario';

    protected $fillable = ['nombre', 'apellido', 'email', 'password', 'telefono_whatsapp', 'estado_activo', 'ultimo_acceso_at'];

    protected $hidden = ['password', 'remember_token'];

    /** @var list<string>|null */
    private ?array $permisosCache = null;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'estado_activo' => 'boolean',
            'ultimo_acceso_at' => 'datetime',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(RolModel::class, 'usuario_rol', 'id_usuario', 'id_rol')->withPivot('created_at');
    }

    /** @return list<string> códigos de permiso efectivos (unión de sus roles activos) */
    public function permisos(): array
    {
        return $this->permisosCache ??= PermisoModel::query()
            ->join('rol_permiso', 'rol_permiso.id_permiso', '=', 'permiso.id_permiso')
            ->join('usuario_rol', 'usuario_rol.id_rol', '=', 'rol_permiso.id_rol')
            ->join('rol', 'rol.id_rol', '=', 'rol_permiso.id_rol')
            ->where('usuario_rol.id_usuario', $this->id_usuario)
            ->where('rol.estado_activo', true)
            ->distinct()
            ->orderBy('permiso.codigo')
            ->pluck('permiso.codigo')
            ->all();
    }

    public function tienePermiso(string $codigo): bool
    {
        return $this->estado_activo && in_array($codigo, $this->permisos(), true);
    }

    public function olvidarPermisos(): void
    {
        $this->permisosCache = null;
    }
}
