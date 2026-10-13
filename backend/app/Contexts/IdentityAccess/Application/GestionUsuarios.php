<?php

namespace App\Contexts\IdentityAccess\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\IdentityAccess\Application\Ports\UsuarioRepositorio;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Casos de uso de usuarios: alta, modificación, baja/alta lógica y asignación de roles.
 * Cada operación se audita en la misma transacción (Context.md §14).
 */
final class GestionUsuarios
{
    private const CONTEXTO = 'identity_access';

    public function __construct(
        private readonly UsuarioRepositorio $usuarios,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     * @param  list<string>  $roles
     */
    public function crear(array $datos, array $roles): int
    {
        return $this->transaccion->ejecutar(function () use ($datos, $roles) {
            $id = $this->usuarios->crear($datos);
            $this->usuarios->sincronizarRoles($id, $roles);
            $this->auditoria->registrar(self::CONTEXTO, 'usuario.creado', 'usuario', $id, null, $this->usuarios->snapshot($id));

            return $id;
        });
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): void
    {
        $this->transaccion->ejecutar(function () use ($id, $datos) {
            $antes = $this->usuarios->snapshot($id);
            $this->usuarios->actualizar($id, $datos);
            $this->auditoria->registrar(self::CONTEXTO, 'usuario.actualizado', 'usuario', $id, $antes, $this->usuarios->snapshot($id));
        });
    }

    /** @param list<string> $roles */
    public function asignarRoles(int $id, array $roles): void
    {
        $this->transaccion->ejecutar(function () use ($id, $roles) {
            $antes = $this->usuarios->snapshot($id);
            $this->usuarios->sincronizarRoles($id, $roles);
            $this->auditoria->registrar(self::CONTEXTO, 'usuario.roles_cambiados', 'usuario', $id, $antes, $this->usuarios->snapshot($id));
        });
    }

    /** Baja o alta lógica: el usuario nunca se borra porque sus registros deben seguir siendo trazables. */
    public function cambiarEstado(int $id, bool $activo, int $actorId): void
    {
        if (! $activo && $id === $actorId) {
            throw new ReglaDeNegocioException('USUARIO_AUTODESHABILITACION', 'No podés deshabilitar tu propio usuario.');
        }

        $this->transaccion->ejecutar(function () use ($id, $activo) {
            $antes = $this->usuarios->snapshot($id);
            $this->usuarios->actualizar($id, ['estado_activo' => $activo]);
            $accion = $activo ? 'usuario.habilitado' : 'usuario.deshabilitado';
            $this->auditoria->registrar(self::CONTEXTO, $accion, 'usuario', $id, $antes, $this->usuarios->snapshot($id));
        });
    }
}
