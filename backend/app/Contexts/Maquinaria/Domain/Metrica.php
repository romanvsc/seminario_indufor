<?php

namespace App\Contexts\Maquinaria\Domain;

/** D08: el tipo de unidad define qué instrumento se lee en mantenimiento. */
enum Metrica: string
{
    case Horometro = 'HOROMETRO';
    case Kilometraje = 'KILOMETRAJE';
}
