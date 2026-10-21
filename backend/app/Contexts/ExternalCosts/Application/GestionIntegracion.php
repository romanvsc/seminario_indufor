<?php

namespace App\Contexts\ExternalCosts\Application;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\ExternalCosts\Application\Ports\ExportadorLecturas;
use App\Contexts\ExternalCosts\Application\Ports\IntegracionRepositorio;
use App\Contexts\ExternalCosts\Application\Ports\LectorConsolidado;
use App\Contexts\ExternalCosts\Domain\Consolidado;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;

/**
 * Intercambio con el Sistema de Control de Gastos e Insumos (RF12, RF13, D13, ADR-004).
 * Solo conoce puertos: el formato del archivo vive en los adaptadores.
 */
final class GestionIntegracion
{
    private const CONTEXTO = 'external_costs';

    public function __construct(
        private readonly IntegracionRepositorio $repo,
        private readonly ExportadorLecturas $exportador,
        private readonly LectorConsolidado $lector,
        private readonly RegistroAuditoria $auditoria,
        private readonly Transaccion $transaccion,
    ) {}

    /**
     * RF12: exporta una lectura. Un error queda registrado en el lote y nunca toca la lectura local.
     *
     * @return bool|null true = exportada, false = falló (queda pendiente), null = no había nada que exportar
     */
    public function exportarLectura(int $idLectura, string $ahora): ?bool
    {
        $lectura = $this->repo->lecturaExportable($idLectura);
        if ($lectura === null || $this->repo->exportacionOk($idLectura)) {
            return null;
        }
        $lote = $this->repo->crearLote(['tipo' => 'EXPORT_LECTURAS', 'estado' => 'EN_PROCESO', 'iniciado_at' => $ahora, 'periodo' => substr($lectura['fecha_lectura'], 0, 7)]);
        try {
            $r = $this->exportador->exportar($lectura);
            $this->repo->actualizarLote($lote, ['estado' => 'OK', 'nombre_archivo' => $r['nombre_archivo'], 'checksum' => $r['checksum'], 'finalizado_at' => $ahora]);

            return true;
        } catch (\Throwable $e) {
            $this->repo->actualizarLote($lote, ['estado' => 'ERROR', 'nombre_archivo' => "lectura-{$idLectura}.csv", 'detalle_error' => $e->getMessage(), 'finalizado_at' => $ahora]);

            return false;
        }
    }

    /** @return array{exportadas: int, con_error: int} */
    public function exportarPendientes(string $ahora): array
    {
        $r = ['exportadas' => 0, 'con_error' => 0];
        foreach ($this->repo->lecturasPendientes() as $id) {
            $ok = $this->exportarLectura($id, $ahora);
            if ($ok !== null) {
                $r[$ok ? 'exportadas' : 'con_error']++;
            }
        }

        return $r;
    }

    /**
     * RF13: importa el consolidado mensual. Mismo archivo = sin cambios; otro archivo del mismo período = rechazo,
     * salvo reemplazo explícito con motivo. Las filas con error quedan en el lote y las válidas se importan.
     *
     * @return array{id_lote: int, ya_importado: bool}
     */
    public function importar(string $contenido, string $nombreArchivo, string $periodo, bool $reemplazar, ?string $motivo, int $actorId, string $ahora): array
    {
        Consolidado::validarPeriodo($periodo);
        $checksum = hash('sha256', $contenido);
        if (($existente = $this->repo->importacionPorChecksum($checksum)) !== null) {
            return ['id_lote' => $existente, 'ya_importado' => true];
        }

        $previos = $this->repo->importacionesDelPeriodo($periodo);
        if ($previos !== [] && ! $reemplazar) {
            $this->falla('PERIODO_YA_IMPORTADO', "El período {$periodo} ya tiene un consolidado importado. Para cargar este archivo en su lugar, elegí reemplazarlo e indicá el motivo.", 'archivo');
        }
        if ($previos !== [] && trim((string) $motivo) === '') {
            $this->falla('MOTIVO_REQUERIDO', 'Indicá por qué se reemplaza el consolidado del período.', 'motivo');
        }

        $clasificacion = Consolidado::clasificar($this->lector->leer($contenido), $periodo, $this->repo->unidadPorCodigo(...));
        $validas = $clasificacion['validas'];
        $errores = $clasificacion['errores'];
        $estado = $validas === [] ? 'ERROR' : ($errores === [] ? 'OK' : 'PARCIAL');

        return $this->transaccion->ejecutar(function () use ($nombreArchivo, $periodo, $checksum, $estado, $validas, $errores, $previos, $motivo, $actorId, $ahora) {
            $lote = $this->repo->crearLote([
                'tipo' => 'IMPORT_CONSUMOS', 'periodo' => $periodo, 'nombre_archivo' => $nombreArchivo, 'checksum' => $checksum,
                'estado' => $estado, 'id_usuario' => $actorId, 'iniciado_at' => $ahora, 'finalizado_at' => $ahora,
                'detalle_error' => $errores === [] ? null : json_encode($errores, JSON_UNESCAPED_UNICODE),
            ]);
            // Un archivo sin filas válidas nunca borra el consolidado anterior: un error de integración no destruye datos locales
            if ($validas !== []) {
                if ($previos !== []) {
                    $borrados = $this->repo->borrarConsumosDelPeriodo($periodo);
                    foreach ($previos as $previo) {
                        $this->repo->actualizarLote($previo, ['estado' => 'REEMPLAZADO']);
                    }
                    $this->auditoria->registrar(self::CONTEXTO, 'consumos.reemplazados', 'integracion_lote', $lote, ['lotes' => $previos, 'consumos' => $borrados], ['lote' => $lote, 'motivo' => trim((string) $motivo)]);
                }
                $this->repo->insertarConsumos($lote, $periodo, $validas);
            }
            $this->auditoria->registrar(self::CONTEXTO, 'consumos.importados', 'integracion_lote', $lote, null, $this->repo->lote($lote) + ['filas_validas' => count($validas), 'filas_con_error' => count($errores)]);

            return ['id_lote' => $lote, 'ya_importado' => false];
        });
    }

    private function falla(string $codigo, string $mensaje, string $campo): never
    {
        throw new ReglaDeNegocioException($codigo, $mensaje, [$campo => [$mensaje]]);
    }
}
