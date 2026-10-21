<?php

namespace App\Contexts\ExternalCosts\Infrastructure;

use App\Contexts\Maquinaria\Infrastructure\UnidadModel;

/** ADR-004: la unidad se identifica ante el sistema externo por su patente, o `INT-<id>` si no tiene. */
final class CodigoUnidad
{
    public static function de(UnidadModel $u): string
    {
        return $u->dominio_patente ?: "INT-{$u->id_unidad}";
    }

    public static function aId(string $codigo): ?int
    {
        $codigo = mb_strtoupper(trim($codigo));
        if (preg_match('/^INT-(\d+)$/', $codigo, $m)) {
            return UnidadModel::whereKey((int) $m[1])->whereNull('dominio_patente')->value('id_unidad');
        }

        return $codigo === '' ? null : UnidadModel::where('dominio_patente', $codigo)->value('id_unidad');
    }
}
