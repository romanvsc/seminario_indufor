<?php

namespace App\Contexts\IdentityAccess\Domain;

/** Roles técnicos (Context.md §10). El código va sin tildes; el nombre visible las conserva. */
enum Rol: string
{
    case Administracion = 'administracion';
    case Gerencia = 'gerencia';
    case Encargado = 'encargado';
    case Operario = 'operario';
    case Camionero = 'camionero';
    case Logistica = 'logistica';
    case Mantenimiento = 'mantenimiento';

    public function nombre(): string
    {
        return match ($this) {
            self::Administracion => 'Administración',
            self::Gerencia => 'Gerencia',
            self::Encargado => 'Encargado de grupo',
            self::Operario => 'Operario / Maquinista',
            self::Camionero => 'Camionero',
            self::Logistica => 'Logística',
            self::Mantenimiento => 'Mantenimiento',
        };
    }
}
