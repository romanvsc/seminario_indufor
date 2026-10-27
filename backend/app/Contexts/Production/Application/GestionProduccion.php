<?php

namespace App\Contexts\Production\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Frentes\Domain\ModalidadProduccion;
use App\Contexts\Production\Application\Ports\ProduccionRepositorio;
use App\Contexts\Production\Domain\ParteProduccion;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Registro y corrección del parte diario. Quien registra queda fijo; toda corrección se audita.
 */
final class GestionProduccion
{
    private const CONTEXTO = 'production';

    public function __construct(
        private readonly ProduccionRepositorio $partes,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /**
     * @param  array<string, mixed>  $datos  validados: id_frente, id_unidad, tipo_madera, fecha_registro, magnitudes, id_operario?, observaciones?
     * @param  list<string>  $rolesActor
     */
    public function registrar(array $datos, int $actorId, array $rolesActor, string $hoy): int
    {
        return $this->transaccion->ejecutar(function () use ($datos, $actorId, $rolesActor, $hoy) {
            $datos = $this->validar($datos + ['id_operario' => null], $actorId, $rolesActor, $hoy);
            $id = $this->partes->crear($datos + ['id_usuario' => $actorId]);
            $this->auditoria->registrar(self::CONTEXTO, 'produccion.registrada', 'produccion', $id, null, $this->partes->snapshot($id));

            return $id;
        });
    }

    /**
     * @param  array<string, mixed>  $cambios
     * @param  list<string>  $rolesActor
     */
    public function corregir(int $id, array $cambios, string $motivo, int $actorId, array $rolesActor, string $hoy): void
    {
        $this->transaccion->ejecutar(function () use ($id, $cambios, $motivo, $actorId, $rolesActor, $hoy) {
            $antes = $this->partes->snapshot($id);
            $datos = array_intersect_key($antes, array_flip(['id_frente', 'id_unidad', 'id_operario', 'tipo_madera', 'fecha_registro', 'cantidad_toneladas', 'metros_cubicos', 'observaciones']));
            $datos = $this->validar(array_merge($datos, $cambios), $actorId, $rolesActor, $hoy);
            $this->partes->actualizar($id, $datos);
            $this->auditoria->registrar(self::CONTEXTO, 'produccion.corregida', 'produccion', $id, $antes, $this->partes->snapshot($id) + ['motivo' => $motivo]);
        });
    }

    /** RF04: la foto es evidencia opcional. Reemplazarla no borra la anterior: queda referida en la auditoría. */
    public function adjuntarFoto(int $id, string $ruta): void
    {
        $this->transaccion->ejecutar(function () use ($id, $ruta) {
            $antes = $this->partes->snapshot($id);
            $this->partes->actualizar($id, ['foto_soporte' => $ruta]);
            $this->auditoria->registrar(self::CONTEXTO, 'produccion.foto_adjuntada', 'produccion', $id, $antes, $this->partes->snapshot($id));
        });
    }

    /**
     * @param  array<string, mixed>  $datos
     * @param  list<string>  $roles
     * @return array<string, mixed>
     */
    private function validar(array $datos, int $actorId, array $roles, string $hoy): array
    {
        $modalidad = $this->partes->modalidadDeFrente($datos['id_frente'])
            ?? throw new ReglaDeNegocioException('FRENTE_INVALIDO', 'El frente no existe o está deshabilitado.', ['id_frente' => ['El frente no existe o está deshabilitado.']]);

        // En carga individual el productor es quien registra (D18)
        if ($modalidad === ModalidadProduccion::Individual && $datos['id_operario'] === null) {
            $datos['id_operario'] = $actorId;
        }

        ParteProduccion::validar(
            $modalidad,
            in_array('encargado', $roles, true),
            in_array('operario', $roles, true),
            $actorId,
            $datos['id_operario'],
            $datos['cantidad_toneladas'] === null ? null : (string) $datos['cantidad_toneladas'],
            $datos['metros_cubicos'] === null ? null : (string) $datos['metros_cubicos'],
            $datos['fecha_registro'],
            $hoy,
        );

        foreach (array_unique(array_filter([$actorId, $datos['id_operario']])) as $idUsuario) {
            if (! $this->partes->estaAsignado($idUsuario, $datos['id_frente'], $datos['fecha_registro'])) {
                $mensaje = $idUsuario === $actorId
                    ? 'No estabas asignado a este frente en la fecha del parte.'
                    : 'El operario no estaba asignado a este frente en la fecha del parte.';
                throw new ReglaDeNegocioException('SIN_ASIGNACION', $mensaje, [$idUsuario === $actorId ? 'id_frente' : 'id_operario' => [$mensaje]]);
            }
        }

        return $datos;
    }
}
