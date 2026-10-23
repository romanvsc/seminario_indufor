<?php

use App\Contexts\Shared\Domain\ReglaDeNegocioException;
use App\Http\Middleware\CabecerasSeguridad;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Formato uniforme de error de la API (docs/adr/ADR-002-formato-errores-api.md). */
$error = fn (int $status, string $code, string $message, array $details = []) => response()->json(
    ['error' => ['code' => $code, 'message' => $message] + ($details ? ['details' => $details] : [])],
    $status,
);

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum en modo SPA: sesión por cookie + CSRF para el frontend declarado en SANCTUM_STATEFUL_DOMAINS
        $middleware->statefulApi();
        // Límite general de pedidos por usuario (o IP sin sesión) y cabeceras de seguridad en toda la API
        $middleware->throttleApi();
        $middleware->appendToGroup('api', CabecerasSeguridad::class);
    })
    ->withExceptions(function (Exceptions $exceptions) use ($error): void {
        $esApi = fn (Request $r) => $r->is('api/*') || $r->expectsJson();
        $exceptions->shouldRenderJsonWhen($esApi);

        $exceptions->render(fn (ValidationException $e, Request $r) => $esApi($r)
            ? $error(422, 'VALIDACION', 'Los datos enviados no son válidos.', $e->errors()) : null);
        $exceptions->render(fn (ReglaDeNegocioException $e, Request $r) => $esApi($r)
            ? $error($e->status, $e->codigo, $e->getMessage(), $e->details) : null);
        $exceptions->render(fn (AuthenticationException $e, Request $r) => $esApi($r)
            ? $error(401, 'NO_AUTENTICADO', 'Tenés que iniciar sesión.') : null);
        $exceptions->render(fn (AuthorizationException|AccessDeniedHttpException $e, Request $r) => $esApi($r)
            ? $error(403, 'SIN_PERMISO', 'No tenés permiso para realizar esta acción.') : null);
        $exceptions->render(fn (ModelNotFoundException|NotFoundHttpException $e, Request $r) => $esApi($r)
            ? $error(404, 'NO_ENCONTRADO', 'El recurso no existe.') : null);
        $exceptions->render(fn (ThrottleRequestsException $e, Request $r) => $esApi($r)
            ? $error(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos. Esperá un minuto.') : null);
        $exceptions->render(fn (TokenMismatchException $e, Request $r) => $esApi($r)
            ? $error(419, 'SESION_EXPIRADA', 'La sesión expiró. Volvé a intentarlo.') : null);
        // Cualquier otro error: sin trazas ni SQL hacia el cliente
        $exceptions->render(function (Throwable $e, Request $r) use ($esApi, $error) {
            if (! $esApi($r) || config('app.debug')) {
                return null;
            }
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;

            return $error($status, 'ERROR_INTERNO', 'Ocurrió un error inesperado.');
        });
    })->create();
