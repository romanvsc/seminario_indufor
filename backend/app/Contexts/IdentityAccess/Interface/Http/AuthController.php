<?php

namespace App\Contexts\IdentityAccess\Interface\Http;

use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\Shared\Domain\ReglaDeNegocioException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

/** Login por sesión (Sanctum SPA, ADR-001). */
final class AuthController
{
    public function login(LoginRequest $request): UsuarioResource
    {
        $ok = Auth::guard('web')->attempt(
            ['email' => $request->string('email')->lower()->value(), 'password' => $request->string('password')->value(), 'estado_activo' => true],
            $request->boolean('recordar'),
        );
        if (! $ok) {
            // Mismo mensaje para usuario inexistente, contraseña errónea o usuario deshabilitado
            throw new ReglaDeNegocioException('CREDENCIALES_INVALIDAS', 'El email o la contraseña no son correctos.');
        }

        $request->session()->regenerate();
        /** @var UsuarioModel $usuario */
        $usuario = Auth::guard('web')->user();
        $usuario->forceFill(['ultimo_acceso_at' => now()])->save();

        return new UsuarioResource($usuario->load('roles'));
    }

    public function me(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user()->load('roles'));
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
