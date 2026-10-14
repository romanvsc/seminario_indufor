<?php

namespace App\Providers;

use App\Contexts\Audit\Application\RegistroAuditoria;
use App\Contexts\Audit\Infrastructure\RegistroAuditoriaEloquent;
use App\Contexts\Frentes\Application\Ports\FrenteRepositorio;
use App\Contexts\Frentes\Infrastructure\FrenteRepositorioEloquent;
use App\Contexts\IdentityAccess\Application\Ports\UsuarioRepositorio;
use App\Contexts\IdentityAccess\Domain\Permiso;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioModel;
use App\Contexts\IdentityAccess\Infrastructure\Persistence\UsuarioRepositorioEloquent;
use App\Contexts\Maquinaria\Application\Ports\MaquinariaRepositorio;
use App\Contexts\Maquinaria\Infrastructure\MaquinariaRepositorioEloquent;
use App\Contexts\Production\Application\Ports\ProduccionRepositorio;
use App\Contexts\Production\Infrastructure\ProduccionRepositorioEloquent;
use App\Contexts\Shared\Application\Transaccion;
use App\Contexts\Shared\Infrastructure\TransaccionDb;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

/** Enlaza puertos con adaptadores y registra un gate por permiso del catálogo. */
class ContextsServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        Transaccion::class => TransaccionDb::class,
        RegistroAuditoria::class => RegistroAuditoriaEloquent::class,
        UsuarioRepositorio::class => UsuarioRepositorioEloquent::class,
        FrenteRepositorio::class => FrenteRepositorioEloquent::class,
        MaquinariaRepositorio::class => MaquinariaRepositorioEloquent::class,
        ProduccionRepositorio::class => ProduccionRepositorioEloquent::class,
    ];

    public function boot(): void
    {
        foreach (Permiso::cases() as $permiso) {
            Gate::define($permiso->value, fn (UsuarioModel $u) => $u->tienePermiso($permiso->value));
        }

        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(5)->by(mb_strtolower((string) $r->input('email')).'|'.$r->ip()));
    }
}
