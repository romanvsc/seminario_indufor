<?php

use App\Contexts\IdentityAccess\Domain\MatrizRbac;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\IdentityAccess\Domain\Rol;

// Dominio puro (sin base ni Laravel): reglas de docs/rbac.md

$codigos = fn (Rol $rol) => collect(MatrizRbac::permisosDe($rol))->map(fn (Permiso $p) => $p->value)->sort()->values()->all();

it('logística solo ve viajes y los catálogos de frentes y maquinaria', function () use ($codigos) {
    expect($codigos(Rol::Logistica))->toBe(['fronts.view', 'logistics.trip.view-all', 'machinery.view']);
});

it('solo administración gestiona frentes, asignaciones y maquinaria', function () use ($codigos) {
    foreach (Rol::cases() as $rol) {
        $gestiona = array_intersect($codigos($rol), ['fronts.manage', 'fronts.assign-users', 'machinery.manage']);
        expect($gestiona)->toHaveCount($rol === Rol::Administracion ? 3 : 0);
    }
});

it('todos los roles consultan frentes y maquinaria', function () use ($codigos) {
    foreach (Rol::cases() as $rol) {
        expect($codigos($rol))->toContain('fronts.view', 'machinery.view');
    }
});
