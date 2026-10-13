<?php

// Reglas de la arquitectura hexagonal (Context.md §7, skill indufor-laravel-backend)

arch('el dominio no depende de Laravel ni de infraestructura')
    ->expect('App\Contexts\*\Domain')
    ->not->toUse(['Illuminate', 'App\Contexts\*\Infrastructure', 'App\Contexts\*\Interface']);

arch('la capa de aplicación no conoce Eloquent ni HTTP')
    ->expect('App\Contexts\*\Application')
    ->not->toUse(['Illuminate\Database', 'Illuminate\Http', 'App\Contexts\*\Infrastructure', 'App\Contexts\*\Interface']);

arch('no quedan helpers de depuración')
    ->expect(['dd', 'dump', 'ray', 'var_dump'])
    ->not->toBeUsed();
