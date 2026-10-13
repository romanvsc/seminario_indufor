<?php

namespace App\Contexts\Frentes\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Frentes\Application\Ports\FrenteRepositorio;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Casos de uso de frentes y de asignaciones históricas de usuarios (D12, D17).
 * Las asignaciones no se borran ni se reescriben: se finalizan con fecha_hasta.
 */
final class GestionFrentes
{
    private const CONTEXTO = 'frentes';

    public function __construct(
        private readonly FrenteRepositorio $frentes,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /** @param array<string, mixed> $datos */
    public function crear(array $datos): int
    {
        return $this->transaccion->ejecutar(function () use ($datos) {
            $id = $this->frentes->crear($datos);
            $this->auditoria->registrar(self::CONTEXTO, 'frente.creado', 'frente_trabajo', $id, null, $this->frentes->snapshot($id));

            return $id;
        });
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): void
    {
        $this->transaccion->ejecutar(function () use ($id, $datos) {
            $antes = $this->frentes->snapshot($id);
            $this->frentes->actualizar($id, $datos);
            $accion = match ($datos['estado_activo'] ?? null) {
                false => 'frente.deshabilitado',
                true => 'frente.habilitado',
                default => 'frente.actualizado',
            };
            $this->auditoria->registrar(self::CONTEXTO, $accion, 'frente_trabajo', $id, $antes, $this->frentes->snapshot($id));
        });
    }

    public function asignar(int $idFrente, int $idUsuario, string $desde, ?string $hasta): int
    {
        return $this->transaccion->ejecutar(function () use ($idFrente, $idUsuario, $desde, $hasta) {
            if ($this->frentes->haySuperposicion($idFrente, $idUsuario, $desde, $hasta)) {
                throw new ReglaDeNegocioException('ASIGNACION_SUPERPUESTA', 'El usuario ya está asignado a este frente en esas fechas.');
            }
            $id = $this->frentes->crearAsignacion($idFrente, $idUsuario, $desde, $hasta);
            $this->auditoria->registrar(self::CONTEXTO, 'asignacion.creada', 'frente_asignado', $id, null, $this->frentes->asignacion($id));

            return $id;
        });
    }

    public function finalizar(int $idAsignacion, string $hasta): void
    {
        $this->transaccion->ejecutar(function () use ($idAsignacion, $hasta) {
            $antes = $this->frentes->asignacion($idAsignacion);
            if ($antes['fecha_hasta'] !== null) {
                throw new ReglaDeNegocioException('ASIGNACION_FINALIZADA', 'La asignación ya tiene fecha de fin.');
            }
            if ($hasta < $antes['fecha_desde']) {
                $mensaje = 'La fecha de fin no puede ser anterior a la de inicio.';
                throw new ReglaDeNegocioException('FECHA_HASTA_INVALIDA', $mensaje, ['fecha_hasta' => [$mensaje]]);
            }
            $this->frentes->finalizarAsignacion($idAsignacion, $hasta);
            $this->auditoria->registrar(self::CONTEXTO, 'asignacion.finalizada', 'frente_asignado', $idAsignacion, $antes, $this->frentes->asignacion($idAsignacion));
        });
    }
}
