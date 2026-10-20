<?php

namespace App\Contexts\Maintenance\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Maintenance\Application\Ports\MantenimientoRepositorio;
use App\Contexts\Maintenance\Domain\ReglaLectura;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Lecturas de horómetro/kilometraje con falla opcional, atención de fallas y control de matafuegos
 * (RF09–RF11, RNF05, D08, D15, D20).
 */
final class GestionMantenimiento
{
    private const CONTEXTO = 'maintenance';

    public function __construct(
        private readonly MantenimientoRepositorio $repo,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /** @param array<string, mixed> $datos validados: id_unidad, fecha_lectura, horometro_actual?, kilometraje_actual?, tiene_falla, detalle_falla? */
    public function registrarLectura(array $datos, int $actorId, string $ahora): int
    {
        return $this->transaccion->ejecutar(function () use ($datos, $actorId, $ahora) {
            // El bloqueo va antes de leer las vecinas: así la comparación y el alta son atómicas por unidad
            $metrica = $this->repo->bloquearUnidad($datos['id_unidad'])
                ?? throw new ReglaDeNegocioException('UNIDAD_INVALIDA', 'La unidad no existe o está deshabilitada.', ['id_unidad' => ['La unidad no existe o está deshabilitada.']]);

            ReglaLectura::validar(
                $metrica,
                $datos['horometro_actual'],
                $datos['kilometraje_actual'],
                $datos['tiene_falla'],
                $datos['detalle_falla'],
                $datos['fecha_lectura'],
                $ahora,
                $this->repo->lecturaVecina($datos['id_unidad'], $metrica, $datos['fecha_lectura'], anterior: true),
                $this->repo->lecturaVecina($datos['id_unidad'], $metrica, $datos['fecha_lectura'], anterior: false),
            );

            $id = $this->repo->crearLectura($datos + ['id_operario_reporte' => $actorId]);
            $lectura = $this->repo->lectura($id);
            $this->auditoria->registrar(self::CONTEXTO, 'lectura.registrada', 'lectura_mantenimiento', $id, null, $lectura);
            if ($datos['tiene_falla']) {
                // RF10: la falla queda abierta y visible para Mantenimiento; no invalida la lectura (Figura 11)
                $this->auditoria->registrar(self::CONTEXTO, 'falla.reportada', 'lectura_mantenimiento', $id, null, $lectura);
            }

            return $id;
        });
    }

    public function atenderFalla(int $idLectura, string $nota, int $actorId, string $ahora): void
    {
        $this->transaccion->ejecutar(function () use ($idLectura, $nota, $actorId, $ahora) {
            $antes = $this->repo->lectura($idLectura, bloquear: true);
            if ($antes === null || ! $antes['tiene_falla']) {
                throw new ReglaDeNegocioException('SIN_FALLA', 'Esa lectura no reporta una falla.');
            }
            if ($antes['falla_atendida_at'] !== null) {
                throw new ReglaDeNegocioException('FALLA_ATENDIDA', 'La falla ya fue marcada como atendida.');
            }
            $this->repo->actualizarLectura($idLectura, ['falla_atendida_at' => $ahora, 'id_usuario_atencion' => $actorId, 'nota_atencion' => $nota]);
            $this->auditoria->registrar(self::CONTEXTO, 'falla.atendida', 'lectura_mantenimiento', $idLectura, $antes, $this->repo->lectura($idLectura));
        });
    }

    /** @param array<string, mixed> $datos validados: id_unidad, estado_matafuego, fecha_revision, fecha_vencimiento_carga */
    public function registrarControl(array $datos, int $actorId, string $hoy): int
    {
        if (! $this->repo->unidadActiva($datos['id_unidad'])) {
            throw new ReglaDeNegocioException('UNIDAD_INVALIDA', 'La unidad no existe o está deshabilitada.', ['id_unidad' => ['La unidad no existe o está deshabilitada.']]);
        }
        if ($datos['fecha_revision'] > $hoy) {
            $mensaje = 'La fecha de revisión no puede ser posterior a hoy.';
            throw new ReglaDeNegocioException('FECHA_FUTURA', $mensaje, ['fecha_revision' => [$mensaje]]);
        }

        return $this->transaccion->ejecutar(function () use ($datos, $actorId) {
            $id = $this->repo->crearControl($datos + ['id_operario' => $actorId]);
            $this->auditoria->registrar(self::CONTEXTO, 'matafuego.controlado', 'control_matafuego', $id, null, $this->repo->control($id));

            return $id;
        });
    }
}
