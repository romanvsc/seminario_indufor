<?php

use App\Contexts\Frentes\Interface\Http\FrenteController;
use App\Contexts\IdentityAccess\Interface\Http\AuthController;
use App\Contexts\IdentityAccess\Interface\Http\UsuarioController;
use App\Contexts\Logistics\Interface\Http\LogisticaController;
use App\Contexts\Maquinaria\Interface\Http\MaquinariaController;
use App\Contexts\Production\Interface\Http\ProduccionController;
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

        // Frentes & Assignments
        Route::get('fronts', [FrenteController::class, 'index'])->middleware('can:fronts.view');
        Route::post('fronts', [FrenteController::class, 'store'])->middleware('can:fronts.manage');
        Route::get('fronts/{frente}', [FrenteController::class, 'show'])->middleware('can:fronts.view');
        Route::put('fronts/{frente}', [FrenteController::class, 'update'])->middleware('can:fronts.manage');
        Route::post('fronts/{frente}/disable', [FrenteController::class, 'deshabilitar'])->middleware('can:fronts.manage');
        Route::post('fronts/{frente}/enable', [FrenteController::class, 'habilitar'])->middleware('can:fronts.manage');
        Route::get('front-assignments', [FrenteController::class, 'asignaciones'])->middleware('can:fronts.view');
        Route::post('front-assignments', [FrenteController::class, 'asignar'])->middleware('can:fronts.assign-users');
        Route::post('front-assignments/{asignacion}/end', [FrenteController::class, 'finalizar'])->middleware('can:fronts.assign-users');

        // Fleet & Machinery
        Route::get('machinery-types', [MaquinariaController::class, 'tipos'])->middleware('can:machinery.view');
        Route::post('machinery-types', [MaquinariaController::class, 'crearTipo'])->middleware('can:machinery.manage');
        Route::put('machinery-types/{tipo}', [MaquinariaController::class, 'actualizarTipo'])->middleware('can:machinery.manage');
        Route::post('machinery-types/{tipo}/disable', [MaquinariaController::class, 'estadoTipo'])->middleware('can:machinery.manage');
        Route::post('machinery-types/{tipo}/enable', [MaquinariaController::class, 'estadoTipo'])->middleware('can:machinery.manage')->name('machinery-types.enable');
        Route::get('machinery', [MaquinariaController::class, 'index'])->middleware('can:machinery.view');
        Route::post('machinery', [MaquinariaController::class, 'store'])->middleware('can:machinery.manage');
        Route::get('machinery/{unidad}', [MaquinariaController::class, 'show'])->middleware('can:machinery.view');
        Route::put('machinery/{unidad}', [MaquinariaController::class, 'update'])->middleware('can:machinery.manage');
        Route::post('machinery/{unidad}/disable', [MaquinariaController::class, 'estado'])->middleware('can:machinery.manage');
        Route::post('machinery/{unidad}/enable', [MaquinariaController::class, 'estado'])->middleware('can:machinery.manage')->name('machinery.enable');

        // Production — alcance por frente y "solo lo propio" se verifican en el controller
        Route::get('wood-types', [ProduccionController::class, 'tiposMadera']);
        Route::get('production', [ProduccionController::class, 'index']);
        Route::post('production', [ProduccionController::class, 'store'])->middleware('can:production.create');
        Route::get('production/{produccion}', [ProduccionController::class, 'show']);
        Route::put('production/{produccion}', [ProduccionController::class, 'update']);
        Route::post('production/{produccion}/photo', [ProduccionController::class, 'subirFoto']);
        Route::get('production/{produccion}/photo', [ProduccionController::class, 'verFoto']);

        // Logistics — el estado VALIDADO solo lo asigna el cotejo; no hay ruta para forzarlo
        Route::get('logistics/trips', [LogisticaController::class, 'viajes']);
        Route::post('logistics/trips', [LogisticaController::class, 'declarar'])->middleware('can:logistics.trip.create');
        Route::get('logistics/trips/{viaje}', [LogisticaController::class, 'viaje']);
        Route::post('logistics/remitos', [LogisticaController::class, 'cargarRemito'])->middleware('can:logistics.remito.create', 'can:logistics.remito.validate');
        Route::get('logistics/corrections', [LogisticaController::class, 'solicitudes'])->middleware('can:logistics.correction.manage');
        Route::post('logistics/corrections/{solicitud}/review', [LogisticaController::class, 'tomar'])->middleware('can:logistics.correction.manage');
        Route::post('logistics/corrections/{solicitud}/resolve', [LogisticaController::class, 'resolver'])->middleware('can:logistics.correction.manage');
    });
});
