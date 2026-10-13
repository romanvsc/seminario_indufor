<?php

namespace App\Contexts\Maquinaria\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Maquinaria\Application\Ports\MaquinariaRepositorio;
use App\Contexts\Shared\Application\Transaccion;

/**
 * Alta, modificación y baja/alta lógica de tipos de maquinaria y de unidades.
 * Nada se borra: lecturas y producción futuras referencian estas filas.
 */
final class GestionMaquinaria
{
    public const TIPO = 'tipo_maquinaria';

    public const UNIDAD = 'maquinaria';

    private const CONTEXTO = 'maquinaria';

    public function __construct(
        private readonly MaquinariaRepositorio $repo,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /** @param array<string, mixed> $datos */
    public function crear(string $entidad, array $datos): int
    {
        return $this->transaccion->ejecutar(function () use ($entidad, $datos) {
            $id = $this->repo->crear($entidad, $datos);
            $this->auditoria->registrar(self::CONTEXTO, "{$entidad}.creado", $entidad, $id, null, $this->repo->snapshot($entidad, $id));

            return $id;
        });
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(string $entidad, int $id, array $datos): void
    {
        $this->transaccion->ejecutar(function () use ($entidad, $id, $datos) {
            $antes = $this->repo->snapshot($entidad, $id);
            $this->repo->actualizar($entidad, $id, $datos);
            $accion = match ($datos['estado_activo'] ?? null) {
                false => 'deshabilitado',
                true => 'habilitado',
                default => 'actualizado',
            };
            $this->auditoria->registrar(self::CONTEXTO, "{$entidad}.{$accion}", $entidad, $id, $antes, $this->repo->snapshot($entidad, $id));
        });
    }
}
