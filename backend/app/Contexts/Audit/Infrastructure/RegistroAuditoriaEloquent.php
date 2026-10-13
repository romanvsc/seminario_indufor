<?php

namespace App\Contexts\Audit\Infrastructure;

use App\Contexts\Audit\Application\RegistroAuditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

final class RegistroAuditoriaEloquent implements RegistroAuditoria
{
    /** Campos que nunca se guardan en before/after. */
    private const SENSIBLES = ['password', 'remember_token', 'token'];

    public function __construct(private readonly Request $request) {}

    public function registrar(
        string $boundedContext,
        string $accion,
        string $entidad,
        string|int|null $entidadId,
        ?array $antes = null,
        ?array $despues = null,
    ): void {
        AuditoriaEventoModel::create([
            'id_usuario' => Auth::id(),
            'bounded_context' => $boundedContext,
            'accion' => $accion,
            'entidad' => $entidad,
            'entidad_id' => $entidadId === null ? null : (string) $entidadId,
            'before_json' => $this->limpiar($antes),
            'after_json' => $this->limpiar($despues),
            'correlation_id' => $this->correlationId(),
            'ip' => $this->request->ip(),
            'user_agent' => Str::limit((string) $this->request->userAgent(), 250, ''),
        ]);
    }

    /** @param array<string, mixed>|null $datos */
    private function limpiar(?array $datos): ?array
    {
        return $datos === null ? null : array_diff_key($datos, array_flip(self::SENSIBLES));
    }

    private function correlationId(): string
    {
        // Un mismo id para todos los eventos de una petición
        if (! $this->request->attributes->has('correlation_id')) {
            $this->request->attributes->set(
                'correlation_id',
                $this->request->header('X-Correlation-Id') ?: (string) Str::uuid(),
            );
        }

        return $this->request->attributes->get('correlation_id');
    }
}
