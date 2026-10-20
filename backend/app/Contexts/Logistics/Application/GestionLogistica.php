<?php

namespace App\Contexts\Logistics\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Logistics\Application\Ports\LogisticaRepositorio;
use App\Contexts\Logistics\Domain\Cotejo;
use App\Contexts\Logistics\Domain\EstadoViaje;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Viajes, remitos, cotejo y solicitudes de corrección (RF05–RF08, D05–D07, D19).
 * No existe ningún camino a VALIDADO que no pase por Cotejo::diferencias().
 */
final class GestionLogistica
{
    private const CONTEXTO = 'logistics';

    public function __construct(
        private readonly LogisticaRepositorio $repo,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /** @param array<string, mixed> $datos validados: id_unidad_camion, id_frente_origen, fecha, destino, tipo_madera, volumen_declarado, observaciones */
    public function declarar(array $datos, int $camioneroId, string $ahora): int
    {
        $origen = $this->repo->nombreFrenteActivo($datos['id_frente_origen']);
        if (! in_array($origen, EstadoViaje::ORIGENES_HABILITADOS, true)) {
            $this->falla('ORIGEN_NO_HABILITADO', 'El origen del viaje debe ser Papel Misionero o Prusia.', 'id_frente_origen');
        }
        if ($datos['fecha'] > $ahora) {
            $this->falla('FECHA_FUTURA', 'La fecha del viaje no puede ser posterior a ahora.', 'fecha');
        }

        return $this->transaccion->ejecutar(function () use ($datos, $camioneroId) {
            $id = $this->repo->crearViaje($datos + ['id_usuario_camionero' => $camioneroId, 'estado_validacion' => EstadoViaje::Pendiente->value]);
            $this->auditoria->registrar(self::CONTEXTO, 'viaje.declarado', 'viaje_logistica', $id, null, $this->repo->viaje($id));

            return $id;
        });
    }

    /**
     * RF06/RF07: Administración carga el remito y el cotejo corre en la misma transacción.
     *
     * @param  array<string, mixed>  $datos  validados: numero_remito, id_viaje, fecha_remito, id_transportista, tipo_madera_remito, volumen_toneladas_remito
     * @return list<string> diferencias encontradas (vacío = VALIDADO)
     */
    public function cargarRemito(array $datos, string $ahora): array
    {
        return $this->transaccion->ejecutar(function () use ($datos, $ahora) {
            $viaje = $this->repo->viaje($datos['id_viaje'], bloquear: true)
                ?? $this->falla('VIAJE_INEXISTENTE', 'El viaje no existe.', 'id_viaje');
            if ($this->repo->remitoDeViaje($viaje['id_viaje']) !== null) {
                $this->falla('VIAJE_CON_REMITO', 'Este viaje ya tiene un remito asociado.', 'id_viaje');
            }
            if ($this->repo->existeRemito($datos['numero_remito'])) {
                $this->falla('REMITO_DUPLICADO', 'Ya existe un remito con ese número.', 'numero_remito');
            }

            $this->repo->crearRemito($datos + ['fecha_recepcion_admin' => $ahora]);
            $this->auditoria->registrar(self::CONTEXTO, 'remito.cargado', 'remito', $datos['numero_remito'], null, $this->repo->remitoDeViaje($viaje['id_viaje']));

            return $this->cotejar($viaje['id_viaje'], $ahora);
        });
    }

    /** Administración toma la solicitud: PENDIENTE → EN_REVISION. */
    public function tomarSolicitud(int $idSolicitud, int $actorId): void
    {
        $this->transaccion->ejecutar(function () use ($idSolicitud, $actorId) {
            $antes = $this->solicitudAbierta($idSolicitud);
            if ($antes['estado'] !== 'PENDIENTE') {
                $this->falla('SOLICITUD_EN_REVISION', 'La solicitud ya está en revisión.', 'estado');
            }
            $this->repo->actualizarSolicitud($idSolicitud, ['estado' => 'EN_REVISION', 'id_usuario_responsable' => $actorId]);
            $this->auditoria->registrar(self::CONTEXTO, 'solicitud.en_revision', 'solicitud_correccion', $idSolicitud, $antes, $this->repo->solicitud($idSolicitud));
        });
    }

    /**
     * D19: se corrige el dato que estaba mal (declaración o remito), con motivo y auditoría, y se recoteja.
     * La solicitud queda RESUELTA; si sigue sin coincidir, el recotejo abre una nueva.
     *
     * @param  array<string, mixed>  $viaje  volumen_declarado?, tipo_madera?
     * @param  array<string, mixed>  $remito  volumen_toneladas_remito?, tipo_madera_remito?, id_transportista?
     * @return list<string> diferencias que quedan tras el recotejo (vacío = VALIDADO)
     */
    public function corregir(int $idSolicitud, array $viaje, array $remito, string $motivo, int $actorId, string $ahora): array
    {
        return $this->transaccion->ejecutar(function () use ($idSolicitud, $viaje, $remito, $motivo, $actorId, $ahora) {
            $solicitud = $this->solicitudAbierta($idSolicitud);
            $antesViaje = $this->repo->viaje($solicitud['id_viaje'], bloquear: true);
            $antesRemito = $this->repo->remitoDeViaje($solicitud['id_viaje']);

            $cambiosViaje = array_diff_assoc($viaje, $antesViaje);
            $cambiosRemito = array_diff_assoc($remito, $antesRemito);
            if ($cambiosViaje === [] && $cambiosRemito === []) {
                $this->falla('SIN_CAMBIOS', 'Indicá qué dato corregir: la declaración o el remito.', 'motivo');
            }

            // La declaración original nunca cambia en silencio: antes/después y motivo quedan auditados
            if ($cambiosViaje !== []) {
                $this->repo->actualizarViaje($solicitud['id_viaje'], $cambiosViaje);
                $this->auditoria->registrar(self::CONTEXTO, 'viaje.declaracion_corregida', 'viaje_logistica', $solicitud['id_viaje'], $antesViaje, $this->repo->viaje($solicitud['id_viaje']) + ['motivo' => $motivo]);
            }
            if ($cambiosRemito !== []) {
                $this->repo->actualizarRemito($antesRemito['numero_remito'], $cambiosRemito);
                $this->auditoria->registrar(self::CONTEXTO, 'remito.corregido', 'remito', $antesRemito['numero_remito'], $antesRemito, $this->repo->remitoDeViaje($solicitud['id_viaje']) + ['motivo' => $motivo]);
            }

            $this->repo->actualizarSolicitud($idSolicitud, ['estado' => 'RESUELTA', 'fecha_resolucion' => $ahora, 'id_usuario_responsable' => $actorId]);
            $this->auditoria->registrar(self::CONTEXTO, 'solicitud.resuelta', 'solicitud_correccion', $idSolicitud, $solicitud, $this->repo->solicitud($idSolicitud) + ['motivo' => $motivo]);

            return $this->cotejar($solicitud['id_viaje'], $ahora);
        });
    }

    /** @return list<string> */
    private function cotejar(int $idViaje, string $ahora): array
    {
        $viaje = $this->repo->viaje($idViaje);
        $remito = $this->repo->remitoDeViaje($idViaje);
        $diferencias = Cotejo::diferencias(
            ['volumen' => $viaje['volumen_declarado'], 'id_tipo_madera' => $viaje['tipo_madera'], 'tipo_madera' => $this->repo->nombreTipoMadera($viaje['tipo_madera']),
                'id_transportista' => $viaje['id_usuario_camionero'], 'transportista' => $this->repo->nombreUsuario($viaje['id_usuario_camionero'])],
            ['volumen' => $remito['volumen_toneladas_remito'], 'id_tipo_madera' => $remito['tipo_madera_remito'], 'tipo_madera' => $this->repo->nombreTipoMadera($remito['tipo_madera_remito']),
                'id_transportista' => $remito['id_transportista'], 'transportista' => $this->repo->nombreUsuario($remito['id_transportista'])],
        );

        $estado = $diferencias === [] ? EstadoViaje::Validado : EstadoViaje::CorreccionSolicitada;
        $this->repo->actualizarViaje($idViaje, ['estado_validacion' => $estado->value]);
        $despues = $this->repo->viaje($idViaje);
        if ($diferencias !== []) {
            $idSolicitud = $this->repo->crearSolicitud($idViaje, implode("\n", $diferencias));
            $this->auditoria->registrar(self::CONTEXTO, 'solicitud.creada', 'solicitud_correccion', $idSolicitud, null, $this->repo->solicitud($idSolicitud));
        }
        $this->auditoria->registrar(self::CONTEXTO, $diferencias === [] ? 'viaje.validado' : 'viaje.correccion_solicitada', 'viaje_logistica', $idViaje, $viaje, $despues);

        return $diferencias;
    }

    /** @return array<string, mixed> */
    private function solicitudAbierta(int $idSolicitud): array
    {
        $s = $this->repo->solicitud($idSolicitud, bloquear: true) ?? $this->falla('SOLICITUD_INEXISTENTE', 'La solicitud no existe.', 'id_solicitud');
        if ($s['estado'] === 'RESUELTA') {
            $this->falla('SOLICITUD_RESUELTA', 'La solicitud ya fue resuelta.', 'estado');
        }

        return $s;
    }

    private function falla(string $codigo, string $mensaje, string $campo): never
    {
        throw new ReglaDeNegocioException($codigo, $mensaje, [$campo => [$mensaje]]);
    }
}
