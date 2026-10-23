<?php

namespace App\Contexts\Shared\Infrastructure;

use App\Contexts\Shared\Application\RegistroIdempotente;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

final class RegistroIdempotenteDb implements RegistroIdempotente
{
    public function ejecutar(int $idUsuario, string $operacion, ?string $clave, array $contenido, callable $crear): array
    {
        if ($clave === null || trim($clave) === '') {
            return ['id' => $crear(), 'nuevo' => true];
        }
        $clave = mb_substr(trim($clave), 0, 64);
        ksort($contenido);
        $hash = hash('sha256', json_encode($contenido, JSON_UNESCAPED_UNICODE));
        $fila = ['id_usuario' => $idUsuario, 'operacion' => $operacion, 'clave' => $clave];

        try {
            // La clave se inserta primero: un segundo envío simultáneo espera en el índice único y después choca
            return DB::transaction(function () use ($fila, $hash, $crear) {
                DB::table('idempotencia')->insert($fila + ['hash_contenido' => $hash, 'created_at' => now()]);
                $id = $crear();
                DB::table('idempotencia')->where($fila)->update(['entidad_id' => $id]);

                return ['id' => $id, 'nuevo' => true];
            });
        } catch (UniqueConstraintViolationException $e) {
            $existente = DB::table('idempotencia')->where($fila)->first();
            if ($existente === null) {
                throw $e; // el choque no fue por la clave sino por otro índice del alta
            }
            if ($existente->hash_contenido !== $hash) {
                throw new ReglaDeNegocioException('CLAVE_REUTILIZADA', 'Este envío ya se registró con otros datos. Revisá el registro guardado antes de cargar uno nuevo.', status: 409);
            }

            return ['id' => (int) $existente->entidad_id, 'nuevo' => false];
        }
    }
}
