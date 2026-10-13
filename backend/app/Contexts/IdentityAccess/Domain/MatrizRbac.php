<?php

namespace App\Contexts\IdentityAccess\Domain;

/**
 * Matriz rol → permiso aprobada (docs/rbac.md). Un test la compara contra ese documento,
 * así que un cambio de permisos exige actualizar ambos.
 */
final class MatrizRbac
{
    /** @return list<Permiso> */
    public static function permisosDe(Rol $rol): array
    {
        $comunes = [Permiso::FrontsView, Permiso::MachineryView];
        $campo = [
            ...$comunes,
            Permiso::ProductionCreate, Permiso::ProductionUpdateOwn, Permiso::ProductionView,
            Permiso::ReadingCreate, Permiso::ExtinguisherCreate, Permiso::ReadingView,
        ];
        $gestionUsuarios = [Permiso::UsersView, Permiso::UsersCreate, Permiso::UsersUpdate, Permiso::UsersDisable];
        $direccion = [
            Permiso::ProductionViewAll, Permiso::TripViewAll,
            Permiso::ReadingView, Permiso::FailureView, Permiso::ExtinguisherView,
            Permiso::ReportsProduction, Permiso::ReportsOperational, Permiso::ReportsFinancial,
            Permiso::DashboardManagement, Permiso::SettingsManage, Permiso::AuditView,
        ];

        return match ($rol) {
            Rol::Administracion => [
                ...$gestionUsuarios, ...$comunes, ...$direccion,
                Permiso::FrontsManage, Permiso::FrontsAssignUsers, Permiso::MachineryManage,
                Permiso::RemitoCreate, Permiso::RemitoValidate, Permiso::CorrectionManage,
                Permiso::IntegrationImportCosts, Permiso::IntegrationExportReadings, Permiso::IntegrationViewHistory,
            ],
            Rol::Gerencia => [...$gestionUsuarios, ...$comunes, ...$direccion],
            Rol::Encargado, Rol::Operario => $campo,
            Rol::Camionero => [...$comunes, Permiso::TripCreate, Permiso::TripViewOwn],
            Rol::Logistica => [...$comunes, Permiso::TripViewAll],
            Rol::Mantenimiento => [
                ...$comunes,
                Permiso::ReadingView, Permiso::FailureView, Permiso::ExtinguisherView,
                Permiso::FailureManage, Permiso::ReportsOperational,
            ],
        };
    }
}
