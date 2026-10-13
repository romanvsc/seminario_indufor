<?php

use App\Contexts\IdentityAccess\Interface\Http\AuthController;
use App\Contexts\IdentityAccess\Interface\Http\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Identity & Access — permisos: docs/rbac.md
        Route::get('users', [UsuarioController::class, 'index'])->middleware('can:users.view');
        Route::post('users', [UsuarioController::class, 'store'])->middleware('can:users.create');
        Route::get('users/{usuario}', [UsuarioController::class, 'show'])->middleware('can:users.view');
        Route::put('users/{usuario}', [UsuarioController::class, 'update'])->middleware('can:users.update');
        Route::put('users/{usuario}/roles', [UsuarioController::class, 'roles'])->middleware('can:users.update');
        Route::post('users/{usuario}/disable', [UsuarioController::class, 'deshabilitar'])->middleware('can:users.disable');
        Route::post('users/{usuario}/enable', [UsuarioController::class, 'habilitar'])->middleware('can:users.disable');
        Route::get('roles', [UsuarioController::class, 'catalogoRoles'])->middleware('can:users.view');
    });
});
