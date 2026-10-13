<?php

namespace App\Contexts\IdentityAccess\Domain;

/** Catálogo de permisos (Context.md §10). No existe production.validate (D16). */
enum Permiso: string
{
    case UsersView = 'users.view';
    case UsersCreate = 'users.create';
    case UsersUpdate = 'users.update';
    case UsersDisable = 'users.disable';

    case FrontsView = 'fronts.view';
    case FrontsManage = 'fronts.manage';
    case FrontsAssignUsers = 'fronts.assign-users';

    case MachineryView = 'machinery.view';
    case MachineryManage = 'machinery.manage';

    case ProductionView = 'production.view';
    case ProductionCreate = 'production.create';
    case ProductionUpdateOwn = 'production.update-own';
    case ProductionViewAll = 'production.view-all';

    case TripCreate = 'logistics.trip.create';
    case TripViewOwn = 'logistics.trip.view-own';
    case TripViewAll = 'logistics.trip.view-all';
    case RemitoCreate = 'logistics.remito.create';
    case RemitoValidate = 'logistics.remito.validate';
    case CorrectionManage = 'logistics.correction.manage';

    case ReadingCreate = 'maintenance.reading.create';
    case ReadingView = 'maintenance.reading.view';
    case FailureView = 'maintenance.failure.view';
    case FailureManage = 'maintenance.failure.manage';
    case ExtinguisherCreate = 'maintenance.extinguisher.create';
    case ExtinguisherView = 'maintenance.extinguisher.view';

    case IntegrationExportReadings = 'integration.export-readings';
    case IntegrationImportCosts = 'integration.import-costs';
    case IntegrationViewHistory = 'integration.view-history';

    case ReportsProduction = 'reports.production';
    case ReportsOperational = 'reports.operational';
    case ReportsFinancial = 'reports.financial';

    case DashboardManagement = 'dashboard.management';
    case SettingsManage = 'settings.manage';
    case AuditView = 'audit.view';
}
